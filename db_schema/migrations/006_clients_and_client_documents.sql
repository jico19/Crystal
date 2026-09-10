-- ============================================================================
-- Migration 006: Clients & Client Clinical Documents (Spec 05)
-- ============================================================================

-- Step 1: Create ENUM types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_status_type') THEN
    CREATE TYPE client_status_type AS ENUM (
      'intake_draft',
      'submitted',
      'active',
      'suspended',
      'discharged'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_doc_category_type') THEN
    CREATE TYPE client_doc_category_type AS ENUM (
      'assessment_485',
      'physician_order',
      'consent_packet',
      'insurance_card',
      'face_sheet'
    );
  END IF;
END $$;

-- Step 2: Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  dob DATE NOT NULL,
  gender VARCHAR(20) NOT NULL,
  medicaid_id VARCHAR(50) NULL,
  status client_status_type NOT NULL DEFAULT 'intake_draft',
  service_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  emergency_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
  care_needs JSONB NOT NULL DEFAULT '{}'::jsonb,
  payer_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for clients
CREATE INDEX IF NOT EXISTS idx_clients_org_status ON public.clients(org_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_medicaid_id ON public.clients(medicaid_id);
CREATE INDEX IF NOT EXISTS idx_clients_names ON public.clients(org_id, last_name, first_name);

-- Trigger for clients updated_at
CREATE OR REPLACE FUNCTION update_clients_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clients_updated_at ON public.clients;
CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_timestamp();

-- Step 3: Create client_documents table
CREATE TABLE IF NOT EXISTS public.client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category client_doc_category_type NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  expiration_date DATE NULL,
  uploaded_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for client_documents
CREATE INDEX IF NOT EXISTS idx_client_docs_client_cat ON public.client_documents(client_id, category);
CREATE INDEX IF NOT EXISTS idx_client_docs_org ON public.client_documents(org_id);
CREATE INDEX IF NOT EXISTS idx_client_docs_expiration ON public.client_documents(expiration_date);

-- Trigger for client_documents updated_at
DROP TRIGGER IF EXISTS trg_client_docs_updated_at ON public.client_documents;
CREATE TRIGGER trg_client_docs_updated_at
  BEFORE UPDATE ON public.client_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_timestamp();

-- Step 4: Row-Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to clients for service_role" ON public.clients;
CREATE POLICY "Allow all access to clients for service_role"
  ON public.clients
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to client_documents for service_role" ON public.client_documents;
CREATE POLICY "Allow all access to client_documents for service_role"
  ON public.client_documents
  FOR ALL
  USING (true)
  WITH CHECK (true);
