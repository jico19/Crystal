-- ============================================================================
-- Migration 012: Client Schedules & Self-Service Portal (Scope 3)
-- ============================================================================

-- Step 1: Create client_schedules table
CREATE TABLE IF NOT EXISTS public.client_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  caregiver_id UUID NULL REFERENCES public.caregiver_profiles(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  service_type VARCHAR(64) NOT NULL DEFAULT 'Personal Support Services',
  caregiver_name VARCHAR(100) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'scheduled',
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for client_schedules
CREATE INDEX IF NOT EXISTS idx_client_schedules_client_date ON public.client_schedules(client_id, service_date);
CREATE INDEX IF NOT EXISTS idx_client_schedules_org ON public.client_schedules(org_id);

-- Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_client_schedules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_client_schedules_updated_at ON public.client_schedules;
CREATE TRIGGER trg_client_schedules_updated_at
  BEFORE UPDATE ON public.client_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_client_schedules_timestamp();

-- Step 2: Row-Level Security
ALTER TABLE public.client_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_schedules_org_isolation" ON public.client_schedules;
CREATE POLICY "client_schedules_org_isolation" ON public.client_schedules
  FOR ALL
  TO authenticated
  USING (
    org_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid
    OR current_setting('request.jwt.claim.role', true) = 'super_admin'
  );

-- Step 3: Seed Sample Client Schedules for Demo Client
DO $$
DECLARE
  target_client_id UUID;
  ga_org_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
BEGIN
  SELECT id INTO target_client_id FROM public.clients WHERE org_id = ga_org_id LIMIT 1;

  IF target_client_id IS NOT NULL THEN
    INSERT INTO public.client_schedules (
      client_id, org_id, service_date, start_time, end_time, service_type, caregiver_name, status, notes
    ) VALUES
    (target_client_id, ga_org_id, CURRENT_DATE + INTERVAL '1 day', '09:00 AM', '01:00 PM', 'Personal Support Services', 'Elena Rostova, CNA', 'scheduled', 'Morning routine, bathing assistance, meal prep'),
    (target_client_id, ga_org_id, CURRENT_DATE + INTERVAL '3 days', '09:00 AM', '01:00 PM', 'Personal Support Services', 'Elena Rostova, CNA', 'scheduled', 'Bathing, light housekeeping, mobility assistance'),
    (target_client_id, ga_org_id, CURRENT_DATE + INTERVAL '5 days', '10:00 AM', '02:00 PM', 'Companion & Respite Care', 'Marcus Vance, PCA', 'scheduled', 'Companionship and pharmacy errand pickup')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
