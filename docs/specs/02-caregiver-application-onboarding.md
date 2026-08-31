# Feature Specification: Caregiver Application & Onboarding Funnel

## 1. Executive Summary & Scope

### 1.1 Goal
Provide an intuitive, multi-step digital job application and onboarding funnel allowing prospective caregivers in Georgia (*With Open Hands*) and Indiana (*Cherish Open Arms*) to register, fill out employment applications, save progress, submit required legal disclosures, and track their onboarding status in real time.

### 1.2 Problem Statement
Caregiver recruiting previously suffered from high candidate drop-off due to multi-page paper packets, lost email attachments, unencrypted PII transmission, and lack of real-time visibility into hiring status. The system requires a secure, mobile-first wizard with draft persistence, instant account creation, PII encryption at rest, and automated coordinator notifications.

### 1.3 Scope Boundaries
- **In-Scope:**
  - 5-Step Application Wizard (Personal Info, Availability, Experience/References, Licensure, Legal Disclosures).
  - Draft state persistence with debounced auto-save to PostgreSQL via Server Actions.
  - Automatic Supabase Auth account creation on Step 1 completion.
  - Row-Level Security restricting applicant access to their own profile.
  - Interactive onboarding progress tracker dashboard for approved applicants.
- **Out-of-Scope:**
  - Direct state registry automated API scraping (verification performed via coordinator workflow & OCR agent).
  - Third-party background check vendor webhook processing (handled in Module 03).

---

## 2. PostgreSQL Database Schema (DDL) & RLS Policies

```sql
-- Enable PGCrypto for sensitive data encryption if required
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Caregiver Application Status Enum
CREATE TYPE caregiver_status_type AS ENUM (
    'draft',
    'submitted',
    'under_review',
    'additional_info_requested',
    'approved',
    'rejected',
    'archived'
);

-- Onboarding Step Status Enum
CREATE TYPE onboarding_step_status_type AS ENUM (
    'not_started',
    'in_progress',
    'submitted',
    'verified',
    'rejected'
);

-- Caregiver Profiles & Application Data Table
CREATE TABLE IF NOT EXISTS public.caregiver_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    state_code VARCHAR(2) NOT NULL CHECK (state_code IN ('GA', 'IN', 'FL')),
    application_status caregiver_status_type NOT NULL DEFAULT 'draft',
    application_step INT NOT NULL DEFAULT 1 CHECK (application_step BETWEEN 1 AND 5),
    
    -- Encrypted PII & Structured Form Data
    personal_info JSONB NOT NULL DEFAULT '{}'::jsonb, -- { first_name, middle_name, last_name, phone, dob, ssn_last4, ssn_encrypted, address }
    positions_applied TEXT[] NOT NULL DEFAULT '{}',   -- ['cna', 'hha', 'companion', 'pca', 'rn', 'lpn']
    availability JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { full_time, part_time, prn, days, shifts, max_hours, travel_miles }
    experience_history JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ employer, title, start_date, end_date, reason, supervisor_contact }]
    professional_licenses JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ license_type, license_number, issuing_state, expiration_date }]
    references JSONB NOT NULL DEFAULT '[]'::jsonb,    -- [{ name, relationship, phone, email, years_known }]
    legal_disclosures JSONB NOT NULL DEFAULT '{}'::jsonb, -- { authorized_us, felony, felony_explanation, drug_screen, background_consent, signature, timestamp }

    -- Onboarding Checklist Milestone Tracking
    onboarding_checklist JSONB NOT NULL DEFAULT '{
        "application_form": "in_progress",
        "id_documents": "not_started",
        "background_check": "not_started",
        "tb_physical": "not_started",
        "in_service_orientation": "not_started",
        "direct_deposit_w4": "not_started",
        "final_admin_approval": "not_started"
    }'::jsonb,

    assigned_coordinator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_caregiver_profiles_user_id ON public.caregiver_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_profiles_org_status ON public.caregiver_profiles(org_id, application_status);
CREATE INDEX IF NOT EXISTS idx_caregiver_profiles_state_code ON public.caregiver_profiles(state_code);

-- Enable RLS
ALTER TABLE public.caregiver_profiles ENABLE ROW LEVEL SECURITY;

-- Caregiver Profiles RLS Policies:
-- 1. Caregiver can view their own profile
CREATE POLICY "Caregivers read own profile"
ON public.caregiver_profiles FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('coordinator', 'admin', 'super_admin')
);

-- 2. Caregiver can update their own draft/profile
CREATE POLICY "Caregivers update own profile"
ON public.caregiver_profiles FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
    OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('coordinator', 'admin', 'super_admin')
)
WITH CHECK (
    user_id = auth.uid()
    OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('coordinator', 'admin', 'super_admin')
);

-- 3. Caregiver can create their own profile row
CREATE POLICY "Caregivers insert own profile"
ON public.caregiver_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
```

---

## 3. TypeScript & Zod Validation Schemas

```typescript
import { z } from 'zod';

// Step 1: Personal Information Schema
export const PersonalInfoStepSchema = z.object({
  first_name: z.string().min(2, 'First name is required').max(50),
  middle_name: z.string().max(50).optional(),
  last_name: z.string().min(2, 'Last name is required').max(50),
  email: z.string().email('Valid email is required'),
  phone: z.string().regex(/^\+?1?\s*\(?-*\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4}$/, 'Valid US phone number required'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be YYYY-MM-DD').refine((date) => {
    const age = (new Date().getTime() - new Date(date).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= 18;
  }, 'Applicant must be at least 18 years old'),
  ssn: z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/, 'Valid 9-digit SSN required'),
  address: z.object({
    street: z.string().min(3, 'Street address is required'),
    unit: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    state: z.string().length(2, 'State code must be 2 letters'),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Valid ZIP code required'),
  }),
});

// Step 2: Availability & Positions Schema
export const AvailabilityStepSchema = z.object({
  positions_applied: z.array(z.enum(['cna', 'hha', 'companion', 'pca', 'rn', 'lpn'])).min(1, 'Select at least one position'),
  availability: z.object({
    full_time: z.boolean(),
    part_time: z.boolean(),
    prn: z.boolean(),
    days_available: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).min(1, 'Select available days'),
    shifts_available: z.array(z.enum(['mornings', 'afternoons', 'evenings', 'overnights', 'live_in'])).min(1, 'Select shifts'),
    max_weekly_hours: z.number().min(1).max(60),
    willing_to_travel_miles: z.number().min(5).max(100),
  }),
});

// Step 3: Experience & References Schema
export const ExperienceStepSchema = z.object({
  experience_history: z.array(z.object({
    employer_name: z.string().min(2, 'Employer name is required'),
    job_title: z.string().min(2, 'Job title is required'),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD').optional(),
    reason_for_leaving: z.string().optional(),
    supervisor_contact: z.string().optional(),
  })).min(1, 'Please provide at least one work experience or write "None"'),
  references: z.array(z.object({
    name: z.string().min(2, 'Reference name is required'),
    relationship: z.enum(['professional', 'personal', 'supervisor']),
    phone: z.string().regex(/^\+?1?\s*\(?-*\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4}$/, 'Valid phone required'),
    email: z.string().email().optional().or(z.literal('')),
    years_known: z.number().min(1, 'Years known must be at least 1'),
  })).min(2, 'At least 2 references are required'),
});

// Step 4: Professional Licenses Schema
export const LicensesStepSchema = z.object({
  professional_licenses: z.array(z.object({
    license_type: z.enum(['CNA', 'HHA', 'LPN', 'RN', 'CPR', 'PCA']),
    license_number: z.string().min(3, 'License number is required'),
    issuing_state: z.string().length(2, 'Issuing state must be 2 letters'),
    expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiration date must be YYYY-MM-DD'),
  })).optional().default([]),
});

// Step 5: Legal Disclosures & Attestation Schema
export const LegalDisclosuresStepSchema = z.object({
  authorized_to_work_in_us: z.literal(true, {
    errorMap: () => ({ message: 'You must be legally authorized to work in the United States' }),
  }),
  felony_conviction: z.boolean(),
  felony_explanation: z.string().optional(),
  drug_screen_consent: z.literal(true, {
    errorMap: () => ({ message: 'Consent to drug screening is required' }),
  }),
  background_check_consent: z.literal(true, {
    errorMap: () => ({ message: 'Consent to background screening is required' }),
  }),
  attestation_signature: z.string().min(3, 'Type your full legal name as digital signature'),
  attestation_timestamp: z.string().datetime(),
});

// Master Caregiver Application Schema
export const CompleteCaregiverApplicationSchema = z.object({
  org_id: z.string().uuid(),
  state_code: z.enum(['GA', 'IN', 'FL']),
  personal_info: PersonalInfoStepSchema,
  availability: AvailabilityStepSchema,
  experience: ExperienceStepSchema,
  licenses: LicensesStepSchema,
  legal_disclosures: LegalDisclosuresStepSchema,
});
```

---

## 4. Server Actions & API Endpoint Specifications

### 4.1 Server Action: `saveCaregiverDraft`
```typescript
'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { encryptPII } from '@/lib/security/encryption';

export interface SaveDraftInput {
  step: number;
  data: Record<string, unknown>;
}

export async function saveCaregiverDraft(input: SaveDraftInput) {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  const updatePayload: Record<string, unknown> = {
    application_step: input.step,
    updated_at: new Date().toISOString(),
  };

  if (input.step === 1) {
    const rawSSN = (input.data as any).ssn;
    updatePayload.personal_info = {
      ...input.data,
      ssn_last4: rawSSN ? rawSSN.replace(/\D/g, '').slice(-4) : undefined,
      ssn_encrypted: rawSSN ? await encryptPII(rawSSN) : undefined,
      ssn: undefined, // Strip raw SSN before saving
    };
  } else if (input.step === 2) {
    updatePayload.positions_applied = (input.data as any).positions_applied;
    updatePayload.availability = (input.data as any).availability;
  } else if (input.step === 3) {
    updatePayload.experience_history = (input.data as any).experience_history;
    updatePayload.references = (input.data as any).references;
  } else if (input.step === 4) {
    updatePayload.professional_licenses = (input.data as any).professional_licenses;
  }

  const { error } = await supabase
    .from('caregiver_profiles')
    .update(updatePayload)
    .eq('user_id', user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
```

### 4.2 Server Action: `submitCaregiverApplication`
```typescript
'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CompleteCaregiverApplicationSchema } from '@/lib/schemas/caregiver-application';
import { sendApplicationSubmittedEmail } from '@/lib/services/ses-mailer';

export async function submitCaregiverApplication() {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  const { data: profile, error: fetchError } = await supabase
    .from('caregiver_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (fetchError || !profile) return { success: false, error: 'Application profile not found' };

  // Validate entire profile before final submission
  const { error: updateError } = await supabase
    .from('caregiver_profiles')
    .update({
      application_status: 'submitted',
      submitted_at: new Date().toISOString(),
      'onboarding_checklist->application_form': 'submitted',
    })
    .eq('user_id', user.id);

  if (updateError) return { success: false, error: updateError.message };

  // Trigger notification
  await sendApplicationSubmittedEmail({
    email: user.email!,
    stateCode: profile.state_code,
    name: profile.personal_info.first_name,
  });

  return { success: true };
}
```

---

## 5. UI/UX & Component Architecture

### 5.1 Component Tree
```
src/app/(portals)/caregiver/apply/
├── page.tsx                           # Master Wizard Container (RSC)
├── WizardHeader.tsx                   # Step progress bar & "Save & Exit" button
├── StepIndicator.tsx                  # 1. Personal | 2. Roles | 3. Experience | 4. Licenses | 5. Attestation
└── steps/
    ├── Step1PersonalInfo.tsx          # Name, Contact, DOB, SSN Masking, Address
    ├── Step2Availability.tsx          # Multi-select cards for CNA/HHA/PCA, shift checkboxes
    ├── Step3ExperienceReferences.tsx  # Dynamic repeater rows for jobs & references
    ├── Step4Licenses.tsx              # License type dropdown, expiration date picker
    └── Step5Attestation.tsx           # Disclosures checkboxes, signature pad / typed attestation
```

### 5.2 Form State Machine
```
[ STEP_LOADED ] ──(user types)──> [ DIRTY ] ──(500ms debounce)──> [ AUTO_SAVING ]
       │                                                                   │
(click next)                                                          (saved ok)
       ▼                                                                   ▼
[ CLIENT_VALIDATION ] ──(valid)──> [ PERSIST_STEP ] ──(success)──> [ NEXT_STEP ]
       │
   (invalid)
       ▼
[ HIGHLIGHT_ERRORS ]
```

---

## 6. Background Automation & Agent Triggers

- **Trigger 1:** `caregiver_profiles.INSERT` (Initial registration) $\rightarrow$ Triggers Welcome Email & Magic Link.
- **Trigger 2:** `caregiver_profiles.UPDATE` with `application_status = 'submitted'`
  - **Agent Integration:** `Agent-Compliance` and `Agent-NotificationDispatcher`.
  - **Workflow:**
    1. Notifies state recruitment coordinator via dashboard badge and SES digest.
    2. Provisions initial records in `caregiver_documents` checklist (Module 03).
    3. Unlocks candidate onboarding portal dashboard.

---

## 7. Edge Cases & Failure Recovery Matrix

| Failure Scenario | Root Cause | System Response & Mitigation |
| :--- | :--- | :--- |
| **Mid-Form Network Drop** | Candidate loses mobile internet | LocalStorage caches active step inputs; toast alerts user; re-syncs once online. |
| **Duplicate SSN Submission** | Candidate previously registered | Encrypted hash uniqueness check returns friendly message: *"Account already exists. Please log in."* |
| **Applicant Under 18** | DOB validation fails | Form blocks progression with alert: *"Applicants must be 18+ to meet state regulatory requirements."* |
| **Session Timeout during Wizard** | JWT expires after inactivity | State preserved in database; candidate resumes exactly at current step upon re-login. |

---

## 8. Acceptance Test Suite (Gherkin Syntax)

```gherkin
Feature: Caregiver Application & Onboarding Wizard

  Scenario: Applicant completes Step 1 and resumes draft later
    Given an applicant enters personal details and SSN on Step 1
    When the applicant clicks "Save & Exit"
    And logs out of the platform
    And logs back in after 2 hours
    Then the wizard should automatically open to Step 1 with all entered data populated
    And the SSN input should display masked as "***-**-1234"

  Scenario: Underage applicant validation
    Given an applicant enters a date of birth corresponding to 17 years of age
    When the applicant attempts to proceed to Step 2
    Then the step transition is blocked
    And an inline error displays "Applicant must be at least 18 years old"

  Scenario: Successful full application submission
    Given an applicant completes all 5 wizard steps with valid data
    When the applicant types their legal name and clicks "Submit Application"
    Then the application status changes to "submitted"
    And a confirmation email is dispatched to the applicant
    And the state coordinator dashboard receives a new applicant notification
```
