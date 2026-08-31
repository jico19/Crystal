# Feature Specification: Caregiver Documents & Credential Tracking

## 1. Executive Summary & Scope

### 1.1 Goal
Provide secure document upload, storage, automated OCR extraction, verification workflows, and automated expiration tracking for caregiver compliance records (CPR, CNA, TB tests, physicals, driver's licenses, auto insurance), ensuring zero lapsed credentials across Georgia and Indiana teams.

### 1.2 Problem Statement
Operating home care agencies without airtight credential tracking exposes the agency to state regulatory penalties, license revocation, and liability. Manual spreadsheet tracking results in missed expiration dates, lost paper records, and unencrypted transmission of sensitive PHI/PII.

### 1.3 Scope Boundaries
- **In-Scope:**
  - Secure multi-format document upload (PDF, PNG, JPEG, HEIC up to 25MB).
  - Private AWS S3 / Supabase Storage buckets with 15-minute expiring presigned URLs.
  - Automated OCR extraction integration (`Agent-DocOCR`) for pre-filling license numbers and expiration dates.
  - Verification workflow (Approve, Reject with Reason, Request Replacement).
  - Daily compliance monitoring worker with 90/60/30/15/7/0 day automated escalation reminders.
- **Out-of-Scope:**
  - Direct real-time biometrics / live fingerprint scanning hardware integration.

---

## 2. PostgreSQL Database Schema (DDL) & RLS Policies

```sql
-- Document Categories Enum
CREATE TYPE document_category_type AS ENUM (
    'drivers_license',
    'social_security_card',
    'cpr_first_aid',
    'cna_hha_license',
    'tb_test_screen',
    'physical_exam',
    'background_check_report',
    'auto_insurance',
    'direct_deposit_form',
    'w4_i9_form',
    'other_compliance_doc'
);

-- Verification Status Enum
CREATE TYPE doc_verification_status_type AS ENUM (
    'pending_upload',
    'under_review',
    'approved',
    'rejected',
    'expired'
);

-- Caregiver Documents Table
CREATE TABLE IF NOT EXISTS public.caregiver_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID NOT NULL REFERENCES public.caregiver_profiles(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    category document_category_type NOT NULL,
    file_storage_path TEXT NOT NULL, -- e.g. "org_id/caregivers/caregiver_id/cpr_cert.pdf"
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    issue_date DATE,
    expiration_date DATE,
    has_no_expiration BOOLEAN NOT NULL DEFAULT false,
    verification_status doc_verification_status_type NOT NULL DEFAULT 'under_review',
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    ocr_extracted_data JSONB DEFAULT '{}'::jsonb, -- { license_number, issuer, confidence_score }
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document Audit Trail Table (Immutable)
CREATE TABLE IF NOT EXISTS public.document_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.caregiver_documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    action VARCHAR(50) NOT NULL CHECK (action IN ('UPLOAD', 'VIEW_PREVIEW', 'DOWNLOAD', 'APPROVE', 'REJECT', 'EXPIRE')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_caregiver_docs_caregiver ON public.caregiver_documents(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_docs_org_category ON public.caregiver_documents(org_id, category);
CREATE INDEX IF NOT EXISTS idx_caregiver_docs_expiration ON public.caregiver_documents(expiration_date) WHERE is_archived = false;

-- Enable RLS
ALTER TABLE public.caregiver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for caregiver_documents
CREATE POLICY "Caregivers read own documents"
ON public.caregiver_documents FOR SELECT
TO authenticated
USING (
    caregiver_id IN (SELECT id FROM public.caregiver_profiles WHERE user_id = auth.uid())
    OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('coordinator', 'admin', 'super_admin')
);

CREATE POLICY "Caregivers insert own documents"
ON public.caregiver_documents FOR INSERT
TO authenticated
WITH CHECK (
    caregiver_id IN (SELECT id FROM public.caregiver_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Staff review and update documents"
ON public.caregiver_documents FOR UPDATE
TO authenticated
USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('coordinator', 'admin', 'super_admin')
    OR caregiver_id IN (SELECT id FROM public.caregiver_profiles WHERE user_id = auth.uid())
);
```

---

## 3. TypeScript & Zod Validation Schemas

```typescript
import { z } from 'zod';

export const DocumentUploadSchema = z.object({
  caregiver_id: z.string().uuid(),
  category: z.enum([
    'drivers_license',
    'social_security_card',
    'cpr_first_aid',
    'cna_hha_license',
    'tb_test_screen',
    'physical_exam',
    'background_check_report',
    'auto_insurance',
    'direct_deposit_form',
    'w4_i9_form',
    'other_compliance_doc',
  ]),
  file_name: z.string().min(1),
  file_size_bytes: z.number().max(25 * 1024 * 1024, 'File size cannot exceed 25MB'),
  mime_type: z.enum(['application/pdf', 'image/png', 'image/jpeg', 'image/heic']),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  has_no_expiration: z.boolean().default(false),
});

export const DocumentReviewSchema = z.object({
  document_id: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
  rejection_reason: z.string().min(5, 'Rejection reason is required when rejecting').optional(),
  corrected_expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
```

---

## 4. Server Actions & API Endpoint Specifications

### 4.1 Server Action: `generateDocumentPresignedUploadUrl`
```typescript
'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function generateDocumentPresignedUploadUrl(payload: {
  category: string;
  fileName: string;
  mimeType: string;
}) {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  const fileKey = `${user.user_metadata.org_id}/caregivers/${user.id}/${payload.category}-${Date.now()}-${payload.fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_PRIVATE_DOCUMENTS_BUCKET!,
    Key: fileKey,
    ContentType: payload.mimeType,
    ServerSideEncryption: 'aws:kms',
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 }); // 15 mins

  return { uploadUrl, fileKey };
}
```

### 4.2 Server Action: `reviewCaregiverDocument`
```typescript
'use server';

import { DocumentReviewSchema } from '@/lib/schemas/documents';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function reviewCaregiverDocument(input: z.infer<typeof DocumentReviewSchema>) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('caregiver_documents')
    .update({
      verification_status: input.decision,
      rejection_reason: input.decision === 'rejected' ? input.rejection_reason : null,
      expiration_date: input.corrected_expiration_date || undefined,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    })
    .eq('id', input.document_id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Write immutable audit entry
  await supabase.from('document_audit_logs').insert({
    document_id: input.document_id,
    user_id: user.id,
    action: input.decision === 'approved' ? 'APPROVE' : 'REJECT',
  });

  return { success: true, data };
}
```

---

## 5. UI/UX & Component Architecture

### 5.1 Component Tree
```
src/app/(portals)/caregiver/documents/
├── page.tsx                           # Caregiver Document Checklist Page
├── ComplianceScoreBanner.tsx          # "85% Compliant - 1 Expiring Soon"
├── DocumentUploadModal.tsx            # Drag & drop dropzone + file preview
└── DocumentChecklistTable.tsx         # List of required compliance cards:
    ├── CPRCard.tsx                    # Status badge, expiry date, re-upload button
    ├── TBTestCard.tsx
    ├── DriverLicenseCard.tsx
    └── BackgroundCheckCard.tsx
```

---

## 6. Background Automation & Agent Triggers

- **Trigger:** Daily midnight cron (`0 0 * * *`)
- **Agent Integration:** `Agent-Compliance` and `Agent-DocOCR`
- **Workflow:**
  1. `Agent-DocOCR` inspects newly uploaded PDFs/images, extracts license numbers/dates, and populates `ocr_extracted_data`.
  2. `Agent-Compliance` evaluates all active records. If a document is 30 days from expiration, it triggers an automated SMS and email reminder to the caregiver and places an alert badge on the coordinator's review desk.

---

## 7. Edge Cases & Failure Recovery Matrix

| Failure Scenario | Root Cause | System Response & Mitigation |
| :--- | :--- | :--- |
| **Blurry or Unreadable Upload** | Low-quality camera photo | OCR Agent confidence $< 60\%$ $\rightarrow$ flags document as "Low Quality Scan" for coordinator review. |
| **Expired Presigned URL** | User leaves preview open $> 15$ mins | Secure viewer detects 403 and automatically requests a fresh presigned URL in the background. |
| **Missing Expiration on Evergreen Doc** | Social Security Card or W-4 | UI allows checking `has_no_expiration: true`, bypassing automated expiration alerts. |

---

## 8. Acceptance Test Suite (Gherkin Syntax)

```gherkin
Feature: Caregiver Document Credential Tracking

  Scenario: Caregiver uploads CPR certification
    Given an authenticated caregiver on the documents page
    When the caregiver uploads a valid 2MB PDF for "CPR / First Aid"
    Then the file is securely saved to encrypted S3 storage
    And a record is created in "caregiver_documents" with status "under_review"
    And an immutable "UPLOAD" audit log entry is generated

  Scenario: Expiration notification trigger
    Given a caregiver with a CNA license expiring in 30 days
    When the daily compliance monitoring agent executes
    Then an urgent renewal notification email and SMS are dispatched to the caregiver
    And the document status badge displays "Expiring Soon (30 days)"
```
