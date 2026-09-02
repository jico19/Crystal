-- ============================================================================
-- Crystal Multi-State Platform: Database Schema Snapshot v5
-- Feature Spec 05: Client Intake & Document Management
-- Date: 2026-09-02
-- Target: PostgreSQL 16 / Supabase / PGlite
-- ============================================================================

-- Client Lifecycle Status Enum
DO $$ BEGIN
    CREATE TYPE client_status_type AS ENUM (
        'inquiry',
        'intake_pending',
        'assessment_scheduled',
        'active',
        'on_hold',
        'discharged'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Payer Type Enum
DO $$ BEGIN
    CREATE TYPE payer_type AS ENUM (
        'medicaid_waiver',
        'private_pay',
        'va_community_care',
        'long_term_care_insurance',
        'commercial_insurance'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    assigned_rn_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Client Documents Table
CREATE TABLE IF NOT EXISTS public.client_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    doc_type VARCHAR(100) NOT NULL, -- 'physician_orders_485', 'rn_assessment', 'service_agreement', 'insurance_card', 'poa_legal'
    file_storage_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    effective_date DATE,
    expiration_date DATE,
    uploaded_by UUID,
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
DROP POLICY IF EXISTS "Staff view assigned tenant clients" ON public.clients;
CREATE POLICY "Staff view assigned tenant clients"
ON public.clients FOR ALL
TO authenticated
USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
    OR org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
);

DROP POLICY IF EXISTS "Staff manage client documents" ON public.client_documents;
CREATE POLICY "Staff manage client documents"
ON public.client_documents FOR ALL
TO authenticated
USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
    OR org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
);
