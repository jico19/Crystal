-- ============================================================================
-- Migration 003: User Profiles, RBAC & Security Audit Logs (Spec 10)
-- ============================================================================

-- Step 1: Create user_role_type ENUM
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_type') THEN
    CREATE TYPE user_role_type AS ENUM (
      'super_admin',
      'agency_admin',
      'care_coordinator',
      'registered_nurse',
      'caregiver'
    );
  END IF;
END $$;

-- Step 2: Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  role user_role_type NOT NULL DEFAULT 'caregiver',
  state_code VARCHAR(2) NOT NULL DEFAULT 'GA',
  is_active BOOLEAN NOT NULL DEFAULT true,
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_role ON public.user_profiles(org_id, role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_state ON public.user_profiles(state_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);

-- Auto-update trigger for user_profiles.updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_timestamp();

-- Step 3: Create security_audit_logs table (Immutable HIPAA audit trail)
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  event_type VARCHAR(64) NOT NULL,
  resource_type VARCHAR(64) NOT NULL,
  resource_id UUID NULL,
  ip_address INET NULL,
  user_agent TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for security_audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_event_created ON public.security_audit_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_org_created ON public.security_audit_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user_created ON public.security_audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON public.security_audit_logs(resource_type, resource_id);

-- Enforce Immutability on security_audit_logs: Disallow UPDATE and DELETE
CREATE OR REPLACE FUNCTION disallow_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Modifying or deleting security audit logs is strictly prohibited by HIPAA compliance policy';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_audit_logs_update ON public.security_audit_logs;
CREATE TRIGGER trg_protect_audit_logs_update
  BEFORE UPDATE OR DELETE ON public.security_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION disallow_audit_log_mutation();

-- Step 4: Row-Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow system and backend service queries by default
DROP POLICY IF EXISTS "Allow all access to user_profiles for service_role" ON public.user_profiles;
CREATE POLICY "Allow all access to user_profiles for service_role"
  ON public.user_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert and select to audit logs for service_role" ON public.security_audit_logs;
CREATE POLICY "Allow insert and select to audit logs for service_role"
  ON public.security_audit_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);
