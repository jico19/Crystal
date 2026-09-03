-- ============================================================================
-- Migration: 002_caregiver_profiles.sql
-- Description: Creates caregiver_profiles table, enums, indexes, and RLS policies.
-- Spec: 02-caregiver-application-onboarding | Task 01
-- ============================================================================

-- 1. Ensure auth schema, auth.users table, and auth.uid() helper exist for local PostgreSQL compatibility
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
    raw_app_meta_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
BEGIN
    RETURN coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''), (auth.jwt() ->> 'sub'))::uuid;
EXCEPTION
    WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Caregiver Application & Onboarding Enums
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'caregiver_status_type') THEN
        CREATE TYPE caregiver_status_type AS ENUM (
            'draft',
            'submitted',
            'under_review',
            'additional_info_requested',
            'approved',
            'rejected',
            'archived'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'onboarding_step_status_type') THEN
        CREATE TYPE onboarding_step_status_type AS ENUM (
            'not_started',
            'in_progress',
            'submitted',
            'verified',
            'rejected'
        );
    END IF;
END
$$;

-- 3. Caregiver Profiles Table
CREATE TABLE IF NOT EXISTS public.caregiver_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    state_code VARCHAR(2) NOT NULL CHECK (state_code IN ('GA', 'IN', 'FL')),
    application_status caregiver_status_type NOT NULL DEFAULT 'draft',
    application_step INT NOT NULL DEFAULT 1 CHECK (application_step BETWEEN 1 AND 5),
    personal_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    positions_applied TEXT[] NOT NULL DEFAULT '{}',
    availability JSONB NOT NULL DEFAULT '{}'::jsonb,
    experience_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    professional_licenses JSONB NOT NULL DEFAULT '[]'::jsonb,
    "references" JSONB NOT NULL DEFAULT '[]'::jsonb,
    legal_disclosures JSONB NOT NULL DEFAULT '{}'::jsonb,
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

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_caregiver_profiles_user_id ON public.caregiver_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_profiles_org_status ON public.caregiver_profiles(org_id, application_status);
CREATE INDEX IF NOT EXISTS idx_caregiver_profiles_state_code ON public.caregiver_profiles(state_code);

-- 5. Enable Row-Level Security
ALTER TABLE public.caregiver_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Row-Level Security Policies
-- Policy 1: Caregiver can read their own profile; Staff (coordinator/admin/super_admin) can read matching tenant profiles
DROP POLICY IF EXISTS "Caregiver self-read and staff tenant-read" ON public.caregiver_profiles;
CREATE POLICY "Caregiver self-read and staff tenant-read"
ON public.caregiver_profiles FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR (
        coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('coordinator', 'admin', 'super_admin')
        AND (
            coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
            OR org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
        )
    )
);

-- Policy 2: Caregiver can insert their own draft profile
DROP POLICY IF EXISTS "Caregiver self-insert" ON public.caregiver_profiles;
CREATE POLICY "Caregiver self-insert"
ON public.caregiver_profiles FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
);

-- Policy 3: Caregiver can update their own profile; Staff can update profiles in their tenant
DROP POLICY IF EXISTS "Caregiver self-update and staff tenant-update" ON public.caregiver_profiles;
CREATE POLICY "Caregiver self-update and staff tenant-update"
ON public.caregiver_profiles FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid()
    OR (
        coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('coordinator', 'admin', 'super_admin')
        AND (
            coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
            OR org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
        )
    )
)
WITH CHECK (
    user_id = auth.uid()
    OR (
        coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('coordinator', 'admin', 'super_admin')
        AND (
            coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
            OR org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
        )
    )
);
