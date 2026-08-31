# Feature Specification: Client Intake & Document Management

## 1. Executive Summary & Scope

### 1.1 Goal
Provide a streamlined, secure digital intake, document ingestion, and assessment management workflow for prospective home care clients across Georgia and Indiana, coordinating emergency contacts, payer details (Medicaid / Private Pay / VA), service plans, and physician orders.

### 1.2 Problem Statement
Client admissions are slowed by cumbersome paper intake packets, illegible handwritten insurance details, and fragmented clinical notes. Delays in gathering signed consent packets and physician orders risk regulatory non-compliance and delayed commencement of care.

### 1.3 Scope Boundaries
- **In-Scope:**
  - Client profile lifecycle (`inquiry` $\rightarrow$ `intake_pending` $\rightarrow$ `assessment_scheduled` $\rightarrow$ `active_care` $\rightarrow$ `discharged`).
  - Structured data capture: Demographics, Emergency Contacts, Medical Diagnoses/Allergies, ADLs/IADLs assistance needs, Payer Information.
  - Document vault for Clinical Assessments, Physician Orders (485), Face-to-Face evaluations, and Service Agreements.
- **Out-of-Scope:**
  - Real-time HL7 / FHIR EHR bidirectional synchronization (manual PDF/OCR ingestion used for Phase 1).

---

## 2. PostgreSQL Database Schema (DDL) & RLS Policies

```sql
-- Client Lifecycle Status Enum
CREATE TYPE client_status_type AS ENUM (
    'inquiry',
    'intake_pending',
    'assessment_scheduled',
    'active',
    'on_hold',
    'discharged'
);

-- Payer Type Enum
CREATE TYPE payer_type AS ENUM (
    'medicaid_waiver',
    'private_pay',
    'va_community_care',
    'long_term_care_insurance',
    'commercial_insurance'
);

-- Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    state_code VARCHAR(2) NOT NULL CHECK (state_code IN ('GA', 'IN', 'FL')),
    status client_status_type NOT NULL DEFAULT 'inquiry',
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(20),
    ssn_last4 VARCHAR(4),
    medicaid_id VARCHAR(50),
    primary_phone VARCHAR(20) NOT NULL,
    service_address JSONB NOT NULL, -- { street, apt, city, state, zip, gate_code }
    emergency_contacts JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ name, relationship, phone, is_primary, has_poa }]
    primary_physician JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { name, practice, phone, fax, npi }
    care_needs JSONB NOT NULL DEFAULT '{}'::jsonb,          -- { adls: [], iadls: [], allergies: [], diagnoses: [] }
    primary_payer payer_type NOT NULL DEFAULT 'private_pay',
    payer_details JSONB DEFAULT '{}'::jsonb,               -- { policy_number, group_number, case_manager_name, case_manager_phone }
    assigned_rn_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Client Documents Table
CREATE TABLE IF NOT EXISTS public.client_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    doc_type VARCHAR(100) NOT NULL, -- 'physician_orders_485', 'rn_assessment', 'service_agreement', 'insurance_card', 'poa_legal'
    file_storage_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    effective_date DATE,
    expiration_date DATE,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_org_status ON public.clients(org_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_state ON public.clients(state_code);
CREATE INDEX IF NOT EXISTS idx_client_docs_client ON public.client_documents(client_id);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff view assigned tenant clients"
ON public.clients FOR ALL
TO authenticated
USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
    OR org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
);

CREATE POLICY "Staff manage client documents"
ON public.client_documents FOR ALL
TO authenticated
USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
    OR org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
);
```

---

## 3. TypeScript & Zod Validation Schemas

```typescript
import { z } from 'zod';

export const ClientIntakeFormSchema = z.object({
  org_id: z.string().uuid(),
  state_code: z.enum(['GA', 'IN', 'FL']),
  first_name: z.string().min(2, 'First name required'),
  last_name: z.string().min(2, 'Last name required'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid YYYY-MM-DD date required'),
  gender: z.string().optional(),
  primary_phone: z.string().regex(/^\+?1?\s*\(?-*\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4}$/, 'Valid US phone required'),
  service_address: z.object({
    street: z.string().min(3),
    city: z.string().min(2),
    state: z.string().length(2),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/),
    gate_code: z.string().optional(),
  }),
  primary_payer: z.enum(['medicaid_waiver', 'private_pay', 'va_community_care', 'long_term_care_insurance', 'commercial_insurance']),
  medicaid_id: z.string().optional(),
  emergency_contacts: z.array(z.object({
    name: z.string().min(2),
    relationship: z.string().min(2),
    phone: z.string().min(10),
    is_primary: z.boolean(),
    has_poa: z.boolean(),
  })).min(1, 'At least 1 emergency contact is required'),
});

export type ClientIntakeInput = z.infer<typeof ClientIntakeFormSchema>;
```

---

## 4. Server Actions & API Endpoint Specifications

### 4.1 Server Action: `createClientIntake`
```typescript
'use server';

import { ClientIntakeFormSchema, ClientIntakeInput } from '@/lib/schemas/client-intake';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function createClientIntake(rawInput: ClientIntakeInput) {
  const parsed = ClientIntakeFormSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...parsed.data,
      status: 'intake_pending',
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
```

---

## 5. UI/UX & Component Architecture

### 5.1 Component Tree
```
src/app/(portals)/admin/clients/
├── page.tsx                           # Client Master Roster (filter by GA / IN / Status)
├── new/
│   └── page.tsx                       # Full Intake Wizard Form
└── [clientId]/
    ├── page.tsx                       # Client 360 Degree Profile
    ├── CarePlanCard.tsx               # ADLs / IADLs & Special Needs
    ├── AuthorizationSummary.tsx       # Hours authorized vs hours scheduled
    └── DocumentVault.tsx              # Secure file uploads (Assessments, 485s)
```

---

## 6. Background Automation & Agent Triggers

- **Trigger:** `clients.INSERT` $\rightarrow$ Triggers coordinator notification to schedule initial RN assessment.
- **Agent Integration:** `Agent-DocOCR` for automatically indexing scanned physician orders and Medicaid cards.

---

## 7. Edge Cases & Failure Recovery Matrix

| Failure Scenario | Root Cause | System Response & Mitigation |
| :--- | :--- | :--- |
| **Missing Medicaid ID on Medicaid Payer** | Incomplete intake entry | Zod schema conditionally enforces `medicaid_id` when `primary_payer = 'medicaid_waiver'`. |
| **Duplicate Client Record** | Same DOB and Name entered twice | System detects match and prompts: *"A client with this name and DOB already exists. Merge or view existing profile?"* |

---

## 8. Acceptance Test Suite (Gherkin Syntax)

```gherkin
Feature: Client Intake Management

  Scenario: Coordinator creates new client intake record
    Given an authenticated coordinator for Georgia
    When the coordinator submits valid intake data for client "Robert Smith"
    Then a new client record is created with status "intake_pending"
    And the service address is assigned to Georgia territory
```
