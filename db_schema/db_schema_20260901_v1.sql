-- ============================================================================
-- Crystal Multi-State Home Care Platform Database Schema
-- Version: db_schema_20260901_v1
-- Description: Baseline unified schema supporting multi-state tenants (GA, IN, FL),
--              caregivers, clients, credentials, authorizations, in-service
--              training, secure documents, and PostgreSQL Row-Level Security (RLS).
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS & CUSTOM DOMAIN TYPES
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM (
        'super_admin',
        'state_admin',
        'agency_staff',
        'training_admin',
        'caregiver',
        'client'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status_type AS ENUM (
        'pending',
        'active',
        'suspended',
        'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE caregiver_app_status_type AS ENUM (
        'draft',
        'submitted',
        'under_review',
        'approved',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE compliance_status_type AS ENUM (
        'compliant',
        'expiring_soon',
        'non_compliant',
        'action_required'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status_type AS ENUM (
        'pending',
        'approved',
        'rejected',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE client_status_type AS ENUM (
        'intake_draft',
        'submitted',
        'active',
        'discharged'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE auth_status_type AS ENUM (
        'active',
        'expiring_soon',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE training_status_type AS ENUM (
        'not_started',
        'in_progress',
        'passed',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. ORGANIZATIONS (TENANTS / STATES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    state_code VARCHAR(2) NOT NULL UNIQUE CHECK (state_code IN ('GA', 'IN', 'FL')),
    domain VARCHAR(255) NOT NULL UNIQUE,
    license_number VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    emergency_phone VARCHAR(20),
    office_address JSONB NOT NULL DEFAULT '{}'::jsonb, -- { street, city, state, zip }
    office_hours VARCHAR(255) NOT NULL DEFAULT 'Mon-Fri 8:30 AM - 5:00 PM EST',
    branding_config JSONB NOT NULL DEFAULT '{}'::jsonb, -- { primary_color, accent_color, logo_url, favicon_url, disclosures }
    enabled_services JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. USERS & PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE RESTRICT,
    role user_role_type NOT NULL DEFAULT 'caregiver',
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    status user_status_type NOT NULL DEFAULT 'pending',
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    last_sign_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. CAREGIVERS & CREDENTIALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.caregivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    application_status caregiver_app_status_type NOT NULL DEFAULT 'draft',
    application_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    compliance_status compliance_status_type NOT NULL DEFAULT 'action_required',
    hired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID NOT NULL REFERENCES public.caregivers(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    credential_type VARCHAR(100) NOT NULL, -- 'cpr', 'cna', 'tb_test', 'auto_insurance', 'driver_license', 'physical_exam'
    issue_date DATE,
    expiration_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'expiring_soon', 'expired', 'missing')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. CLIENTS & AUTHORIZATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    medicaid_id VARCHAR(100),
    primary_diagnosis TEXT,
    status client_status_type NOT NULL DEFAULT 'intake_draft',
    intake_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    care_plan_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    service_start_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.authorizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    payer_name VARCHAR(255) NOT NULL,
    auth_number VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    authorized_units INT NOT NULL DEFAULT 0,
    used_units INT NOT NULL DEFAULT 0,
    status auth_status_type NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. SECURE DOCUMENTS (CAREGIVER & CLIENT)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('caregiver', 'client')),
    category VARCHAR(100) NOT NULL, -- 'drivers_license', 'cpr_cert', 'tb_clearance', 'insurance_card', 'poc', 'poa'
    storage_path VARCHAR(500) NOT NULL, -- Private S3 / Supabase storage path
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    expiration_date DATE,
    verification_status verification_status_type NOT NULL DEFAULT 'pending',
    verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. IN-SERVICE TRAINING & CERTIFICATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE, -- NULL indicates global/cross-state course
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    video_url VARCHAR(500) NOT NULL,
    passing_score NUMERIC(5,2) NOT NULL DEFAULT 80.00,
    hours_credit NUMERIC(4,2) NOT NULL DEFAULT 1.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    module_order INT NOT NULL DEFAULT 1,
    content_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL UNIQUE REFERENCES public.courses(id) ON DELETE CASCADE,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ id, prompt, options: [], correct_option_id }]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.training_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    status training_status_type NOT NULL DEFAULT 'not_started',
    quiz_score NUMERIC(5,2),
    completed_at TIMESTAMPTZ,
    certificate_number VARCHAR(100) UNIQUE,
    certificate_storage_path VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 8. PUBLIC INQUIRIES & LEAD CAPTURE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.public_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    state_code VARCHAR(2) NOT NULL,
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

-- ============================================================================
-- 9. SECURITY & HIPAA AUDIT LOGS (IMMUTABLE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- 'AUTH_LOGIN', 'VIEW_PHI', 'GENERATE_PRESIGNED_URL', 'UPDATE_CREDENTIAL'
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 10. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organizations_state_code ON public.organizations(state_code);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON public.organizations(domain);
CREATE INDEX IF NOT EXISTS idx_users_org_role ON public.users(org_id, role);
CREATE INDEX IF NOT EXISTS idx_caregivers_org_status ON public.caregivers(org_id, compliance_status);
CREATE INDEX IF NOT EXISTS idx_credentials_caregiver_exp ON public.credentials(caregiver_id, expiration_date);
CREATE INDEX IF NOT EXISTS idx_clients_org_status ON public.clients(org_id, status);
CREATE INDEX IF NOT EXISTS idx_authorizations_client_end ON public.authorizations(client_id, end_date);
CREATE INDEX IF NOT EXISTS idx_documents_org_owner ON public.documents(org_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_expiration ON public.documents(expiration_date);
CREATE INDEX IF NOT EXISTS idx_training_records_user_course ON public.training_records(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_public_inquiries_org_created ON public.public_inquiries(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created ON public.security_audit_logs(event_type, created_at DESC);

-- ============================================================================
-- 11. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tenant tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions for JWT claims evaluation
CREATE OR REPLACE FUNCTION public.current_user_org() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'org_id', '')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION public.current_user_role() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'role', '')::TEXT;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION public.current_user_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'sub', '')::UUID;
$$ LANGUAGE SQL STABLE;

-- RLS: Organizations
CREATE POLICY "Public read active organizations" ON public.organizations
    FOR SELECT USING (is_active = true);

CREATE POLICY "Super admin manage organizations" ON public.organizations
    FOR ALL USING (public.current_user_role() = 'super_admin');

-- RLS: Users
CREATE POLICY "Users read own record or staff read org users" ON public.users
    FOR SELECT USING (
        id = public.current_user_id()
        OR (public.current_user_role() IN ('super_admin'))
        OR (public.current_user_role() IN ('state_admin', 'agency_staff') AND org_id = public.current_user_org())
    );

-- RLS: Documents
CREATE POLICY "Super admin full access on documents" ON public.documents
    FOR ALL USING (public.current_user_role() = 'super_admin');

CREATE POLICY "State admin and staff access org documents" ON public.documents
    FOR ALL USING (
        public.current_user_role() IN ('state_admin', 'agency_staff')
        AND org_id = public.current_user_org()
    );

CREATE POLICY "Owners manage own documents" ON public.documents
    FOR ALL USING (owner_id = public.current_user_id());

-- RLS: Public Inquiries
CREATE POLICY "Public insert inquiries" ON public.public_inquiries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff read org inquiries" ON public.public_inquiries
    FOR SELECT USING (
        public.current_user_role() = 'super_admin'
        OR (public.current_user_role() IN ('state_admin', 'agency_staff') AND org_id = public.current_user_org())
    );

-- RLS: Audit Logs (Append-Only)
CREATE POLICY "System insert audit logs" ON public.security_audit_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Super admin read audit logs" ON public.security_audit_logs
    FOR SELECT USING (public.current_user_role() = 'super_admin');
