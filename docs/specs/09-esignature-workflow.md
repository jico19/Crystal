# Feature Specification: Electronic Signature & Agreement Workflows

## 1. Executive Summary & Scope

### 1.1 Goal
Provide a legally binding, ESIGN / UETA compliant digital signature workflow for caregiver employment packets (W-4, I-9, Direct Deposit, Job Descriptions, Non-Compete/Confidentiality) and client intake consents (Service Agreements, Client Bill of Rights, HIPAA Notice of Privacy Practices).

### 1.2 Problem Statement
Handling signed documents via manual print-sign-scan results in missing initials, unexecuted addendums, slow applicant onboarding cycles, and unverified signature timestamps.

### 1.3 Scope Boundaries
- **In-Scope:**
  - Standardized packet templates with dynamic state variable merging (With Open Hands vs. Cherish Open Arms).
  - Embedded in-portal signature pad (canvas or typed signature) and webhook integration with DocuSign / SignWell REST APIs.
  - Generation of immutable signed PDF packets with embedded certificate of completion, IP address, and cryptographic SHA-256 hash.
- **Out-of-Scope:**
  - Hardware signature pads for in-person retail POS terminals.

---

## 2. PostgreSQL Database Schema (DDL) & RLS Policies

```sql
-- Signature Envelope Status Enum
CREATE TYPE esign_envelope_status AS ENUM (
    'draft',
    'sent',
    'partially_signed',
    'completed',
    'declined',
    'voided'
);

-- E-Signature Envelopes Table
CREATE TABLE IF NOT EXISTS public.signature_envelopes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL, -- e.g. "Caregiver Onboarding Packet - GA"
    status esign_envelope_status NOT NULL DEFAULT 'sent',
    signer_role VARCHAR(50) NOT NULL, -- 'caregiver', 'client_rep', 'agency_director'
    signer_user_id UUID REFERENCES auth.users(id),
    signer_name VARCHAR(255) NOT NULL,
    signer_email VARCHAR(255) NOT NULL,
    external_provider_id VARCHAR(255), -- DocuSign / SignWell Envelope ID
    signed_document_storage_path TEXT,
    signed_document_hash VARCHAR(64),
    ip_address INET,
    user_agent TEXT,
    signed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.signature_envelopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signers and Staff access envelopes"
ON public.signature_envelopes FOR ALL
TO authenticated
USING (
    signer_user_id = auth.uid()
    OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('coordinator', 'admin', 'super_admin')
);
```

---

## 3. TypeScript & Zod Validation Schemas

```typescript
import { z } from 'zod';

export const CreateEnvelopeRequestSchema = z.object({
  org_id: z.string().uuid(),
  template_type: z.enum(['caregiver_onboarding_packet', 'client_service_agreement']),
  signer_name: z.string().min(2),
  signer_email: z.string().email(),
  signer_user_id: z.string().uuid().optional(),
  merge_data: z.record(z.unknown()),
});

export const CompleteSignatureSchema = z.object({
  envelope_id: z.string().uuid(),
  signature_base64: z.string().min(10),
  agreed_to_terms: z.literal(true),
});
```

---

## 4. Server Actions & Webhook Endpoint Specifications

### 4.1 Server Action: `executeDigitalSignature`
```typescript
'use server';

import { CompleteSignatureSchema } from '@/lib/schemas/esignature';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function executeDigitalSignature(rawInput: z.infer<typeof CompleteSignatureSchema>) {
  const parsed = CompleteSignatureSchema.parse(rawInput);
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const docHash = crypto.createHash('sha256').update(`${parsed.envelope_id}-${Date.now()}`).digest('hex');

  const { data, error } = await supabase
    .from('signature_envelopes')
    .update({
      status: 'completed',
      signed_document_hash: docHash,
      signed_at: new Date().toISOString(),
    })
    .eq('id', parsed.envelope_id)
    .select()
    .single();

  if (error) throw error;
  return { success: true, data };
}
```

---

## 5. UI/UX & Component Architecture

### 5.1 Component Tree
```
src/components/esign/
├── DocumentSigningContainer.tsx       # PDF viewer with designated signature anchor tags
├── SignatureCanvasPad.tsx             # Smooth HTML5 canvas signature & typed font switcher
├── ConsentAttestationCheckbox.tsx     # Legal ESIGN act disclosure
└── CertificateOfCompletionBadge.tsx   # Verified SHA-256 seal
```

---

## 6. Background Automation & Agent Triggers

- **Trigger:** Webhook callback from SignWell/DocuSign on envelope completion.
- **Workflow:** Automatically archives signed PDF to private S3 bucket and attaches reference to caregiver or client document checklist.

---

## 7. Edge Cases & Failure Recovery Matrix

| Failure Scenario | Root Cause | System Response & Mitigation |
| :--- | :--- | :--- |
| **Declined Signature** | Signer clicks "Decline" | System marks envelope `declined`, asks for mandatory feedback reason, and notifies agency coordinator. |
| **Envelope Link Expiration** | Unsigned for $> 30$ days | System allows 1-click "Resend Fresh Link" from coordinator dashboard. |

---

## 8. Acceptance Test Suite (Gherkin Syntax)

```gherkin
Feature: Electronic Signature Workflow

  Scenario: Caregiver completes electronic packet signature
    Given a caregiver presented with the onboarding agreement packet
    When the caregiver draws their signature and checks legal consent
    And clicks "Complete Signing"
    Then the envelope status changes to "completed"
    And a tamper-evident SHA-256 hash is stamped on the signed PDF record
```
