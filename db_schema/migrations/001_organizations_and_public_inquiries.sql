-- ============================================================================
-- Migration: 001_organizations_and_public_inquiries.sql
-- Description: Creates organizations and public_inquiries tables, indexes, and RLS policies.
-- Spec: 01-multi-state-website-routing | Task 01
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Ensure auth schema & dummy auth.jwt() function exist for local PostgreSQL compatibility
CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb AS $$
BEGIN
    RETURN coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb;
EXCEPTION
    WHEN OTHERS THEN RETURN '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- 3. Ensure Supabase / App RLS Roles Exist (For Raw Local PostgreSQL)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
END
$$;

-- 4. Organizations / State Tenants Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    state_code VARCHAR(2) NOT NULL UNIQUE CHECK (state_code IN ('GA', 'IN', 'FL')),
    primary_domain VARCHAR(255) NOT NULL UNIQUE,
    subdomains TEXT[] DEFAULT '{}',
    license_number VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    emergency_phone VARCHAR(20),
    office_address JSONB NOT NULL,       -- { street, city, state, zip }
    office_hours VARCHAR(255) NOT NULL DEFAULT 'Mon-Fri 8:30 AM - 5:00 PM EST',
    branding_theme JSONB NOT NULL,       -- { primary_color, secondary_color, accent_color, logo_url, favicon_url, hero_headline, hero_subheading }
    enabled_services JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ slug, title, description, icon_name }]
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Public Contact & Lead Inquiries Table
CREATE TABLE IF NOT EXISTS public.public_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    state_code VARCHAR(2) NOT NULL CHECK (state_code IN ('GA', 'IN', 'FL')),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    inquiry_type VARCHAR(50) NOT NULL CHECK (inquiry_type IN ('caregiver_inquiry', 'client_care_inquiry', 'general_question')),
    message TEXT NOT NULL,
    source_url VARCHAR(500) NOT NULL,
    ip_address INET,
    status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'archived')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_state_code ON public.organizations(state_code);
CREATE INDEX IF NOT EXISTS idx_organizations_primary_domain ON public.organizations(primary_domain);
CREATE INDEX IF NOT EXISTS idx_public_inquiries_org_status ON public.public_inquiries(org_id, status);
CREATE INDEX IF NOT EXISTS idx_public_inquiries_created_at ON public.public_inquiries(created_at DESC);

-- 7. Enable Row-Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_inquiries ENABLE ROW LEVEL SECURITY;

-- 8. Organizations RLS Policies
-- Policy 1: Anyone (public/anon/auth) can read active organization profiles (for theme/branding)
DROP POLICY IF EXISTS "Public read active organizations" ON public.organizations;
CREATE POLICY "Public read active organizations" 
ON public.organizations FOR SELECT 
USING (is_active = true);

-- Policy 2: Super admins can mutate organization settings
DROP POLICY IF EXISTS "Super admin full access on organizations" ON public.organizations;
CREATE POLICY "Super admin full access on organizations"
ON public.organizations FOR ALL
TO authenticated
USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
);

-- 9. Public Inquiries RLS Policies
-- Policy 1: Anyone (anonymous public) can submit a lead inquiry
DROP POLICY IF EXISTS "Anonymous public lead insertion" ON public.public_inquiries;
CREATE POLICY "Anonymous public lead insertion"
ON public.public_inquiries FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 2: Authenticated staff can view inquiries matching their tenant (or super admin view all)
DROP POLICY IF EXISTS "Staff read tenant inquiries" ON public.public_inquiries;
CREATE POLICY "Staff read tenant inquiries"
ON public.public_inquiries FOR SELECT
TO authenticated
USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
    OR org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
);

-- Policy 3: Authenticated staff can update status of tenant inquiries
DROP POLICY IF EXISTS "Staff update tenant inquiries" ON public.public_inquiries;
CREATE POLICY "Staff update tenant inquiries"
ON public.public_inquiries FOR UPDATE
TO authenticated
USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
    OR org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
)
WITH CHECK (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
    OR org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
);
