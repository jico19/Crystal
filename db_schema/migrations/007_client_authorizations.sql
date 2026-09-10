-- ============================================================================
-- Migration 007: Client Prior Authorizations & Utilization (Spec 06)
-- ============================================================================

-- Step 1: Create ENUM types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'authorization_status_type') THEN
    CREATE TYPE authorization_status_type AS ENUM (
      'active',
      'expiring_soon',
      'expired',
      'exhausted'
    );
  END IF;
END $$;

-- Step 2: Create client_authorizations table
CREATE TABLE IF NOT EXISTS public.client_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  auth_number VARCHAR(100) NOT NULL,
  payer_id VARCHAR(100) NOT NULL,
  service_code VARCHAR(50) NOT NULL DEFAULT 'T1019',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_units_authorized INTEGER NOT NULL CHECK (total_units_authorized > 0),
  total_units_used INTEGER NOT NULL DEFAULT 0 CHECK (total_units_used >= 0),
  weekly_unit_cap INTEGER NULL CHECK (weekly_unit_cap > 0),
  status authorization_status_type NOT NULL DEFAULT 'active',
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for client_authorizations
CREATE INDEX IF NOT EXISTS idx_client_auth_client_status ON public.client_authorizations(client_id, status);
CREATE INDEX IF NOT EXISTS idx_client_auth_org_dates ON public.client_authorizations(org_id, end_date);
CREATE INDEX IF NOT EXISTS idx_client_auth_number ON public.client_authorizations(auth_number);

-- Trigger for client_authorizations updated_at
CREATE OR REPLACE FUNCTION update_client_authorizations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_client_authorizations_updated_at ON public.client_authorizations;
CREATE TRIGGER trg_client_authorizations_updated_at
  BEFORE UPDATE ON public.client_authorizations
  FOR EACH ROW
  EXECUTE FUNCTION update_client_authorizations_timestamp();

-- Step 3: Create authorization_unit_logs table (audit trail of unit burns)
CREATE TABLE IF NOT EXISTS public.authorization_unit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authorization_id UUID NOT NULL REFERENCES public.client_authorizations(id) ON DELETE CASCADE,
  units_used_delta INTEGER NOT NULL,
  service_date DATE NULL,
  notes TEXT NULL,
  logged_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_unit_logs_auth_id ON public.authorization_unit_logs(authorization_id, created_at DESC);

-- Step 4: Row-Level Security
ALTER TABLE public.client_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorization_unit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to client_authorizations for service_role" ON public.client_authorizations;
CREATE POLICY "Allow all access to client_authorizations for service_role"
  ON public.client_authorizations
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to authorization_unit_logs for service_role" ON public.authorization_unit_logs;
CREATE POLICY "Allow all access to authorization_unit_logs for service_role"
  ON public.authorization_unit_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);
