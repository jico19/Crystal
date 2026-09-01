-- ============================================================================
-- Crystal Multi-State Home Care Platform
-- Migration: v2 - Caregiver Application & Onboarding Funnel (Spec 02)
-- Description: Adds caregiver_profiles table with 5-step application data,
--              onboarding milestone tracking, PGCrypto SSN encryption, and RLS.
-- ============================================================================

-- Ensure PGCrypto is available for SSN encryption
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- NEW ENUM TYPES
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE caregiver_status_type AS ENUM (
        'draft',
        'submitted',
        'under_review',
        'additional_info_requested',
        'approved',
        'rejected',
        'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE onboarding_step_status_type AS ENUM (
        'not_started',
        'in_progress',
        'submitted',
        'verified',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- CAREGIVER PROFILES TABLE
-- Stores 5-step application form data, encrypted PII, and onboarding state.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.caregiver_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    state_code VARCHAR(2) NOT NULL CHECK (state_code IN ('GA', 'IN', 'FL')),
    application_status caregiver_status_type NOT NULL DEFAULT 'draft',
    application_step INT NOT NULL DEFAULT 1 CHECK (application_step BETWEEN 1 AND 5),

    -- Step 1: Personal Info (SSN stored encrypted, only last 4 digits for display)
    personal_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- { first_name, middle_name, last_name, email, phone, dob, ssn_last4, ssn_encrypted, address }

    -- Step 2: Availability & Positions
    positions_applied TEXT[] NOT NULL DEFAULT '{}',
    availability JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- { full_time, part_time, prn, days_available, shifts_available, max_weekly_hours, willing_to_travel_miles }

    -- Step 3: Experience & References
    experience_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [{ employer_name, job_title, start_date, end_date, reason_for_leaving, supervisor_contact }]
    "references" JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [{ name, relationship, phone, email, years_known }]

    -- Step 4: Professional Licenses
    professional_licenses JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [{ license_type, license_number, issuing_state, expiration_date }]

    -- Step 5: Legal Disclosures & Attestation
    legal_disclosures JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- { authorized_us, felony, felony_explanation, drug_screen, background_consent, signature, timestamp }

    -- Onboarding Milestone Tracking (updated by coordinators / agents)
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

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_caregiver_profiles_user_id
    ON public.caregiver_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_caregiver_profiles_org_status
    ON public.caregiver_profiles(org_id, application_status);

CREATE INDEX IF NOT EXISTS idx_caregiver_profiles_state_code
    ON public.caregiver_profiles(state_code);

CREATE INDEX IF NOT EXISTS idx_caregiver_profiles_submitted_at
    ON public.caregiver_profiles(submitted_at DESC NULLS LAST);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_caregiver_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_caregiver_profiles_updated_at ON public.caregiver_profiles;
CREATE TRIGGER trigger_caregiver_profiles_updated_at
    BEFORE UPDATE ON public.caregiver_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_caregiver_profile_updated_at();

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.caregiver_profiles ENABLE ROW LEVEL SECURITY;

-- Caregivers can read only their own profile; coordinators/admins can read all in their org
CREATE POLICY "Caregivers read own profile"
ON public.caregiver_profiles FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('coordinator', 'agency_staff', 'state_admin', 'super_admin')
);

-- Caregivers can update only their own draft profile
CREATE POLICY "Caregivers update own profile"
ON public.caregiver_profiles FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
    OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('agency_staff', 'state_admin', 'super_admin')
)
WITH CHECK (
    user_id = auth.uid()
    OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('agency_staff', 'state_admin', 'super_admin')
);

-- Any authenticated user can create their own caregiver profile
CREATE POLICY "Caregivers insert own profile"
ON public.caregiver_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Only super_admin can delete profiles (for GDPR/data erasure)
CREATE POLICY "Super admin delete profiles"
ON public.caregiver_profiles FOR DELETE
TO authenticated
USING (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin');
