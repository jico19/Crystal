-- ==============================================================================
-- Feature Spec 06: Client Prior Authorization & Utilization Management
-- Version: 20260902_v6_authorizations
-- Target DB: PostgreSQL 16 / Supabase
-- ==============================================================================

-- 1. Authorization Status Enum
DO $$ BEGIN
    CREATE TYPE auth_status_type AS ENUM (
        'active',
        'expiring_soon',
        'exhausted',
        'expired',
        'renewal_submitted',
        'closed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Client Prior Authorizations Table
CREATE TABLE IF NOT EXISTS public.client_authorizations (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.organizations(id) ON DELETE RESTRICT,
    payer_name VARCHAR(150) NOT NULL, -- e.g. "Georgia Medicaid / CCSP", "Indiana FSSA / A&D Waiver"
    authorization_number VARCHAR(100) NOT NULL,
    procedure_code VARCHAR(20) NOT NULL, -- e.g. "T1019", "S5125", "S5130"
    service_type VARCHAR(100) NOT NULL,  -- "Personal Support Services", "Attendant Care", "Respite"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_units_authorized NUMERIC(10,2) NOT NULL, -- 1 unit = 15 mins (4 units = 1 hr)
    total_units_used NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    weekly_hours_cap NUMERIC(5,2),
    status auth_status_type NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for fast lookup and expiration alerts
CREATE INDEX IF NOT EXISTS idx_auth_client ON public.client_authorizations(client_id);
CREATE INDEX IF NOT EXISTS idx_auth_org ON public.client_authorizations(org_id);
CREATE INDEX IF NOT EXISTS idx_auth_dates_status ON public.client_authorizations(end_date, status);
CREATE INDEX IF NOT EXISTS idx_auth_proc_code ON public.client_authorizations(procedure_code);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.client_authorizations ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Staff manage client authorizations"
ON public.client_authorizations FOR ALL
TO authenticated
USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
    OR org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
);
