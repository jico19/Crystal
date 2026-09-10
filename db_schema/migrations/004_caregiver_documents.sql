-- ============================================================================
-- Migration 004: Caregiver Documents & Credential Tracking (Spec 03)
-- ============================================================================

-- Step 1: Create ENUM types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_category_type') THEN
    CREATE TYPE document_category_type AS ENUM (
      'drivers_license',
      'social_security_card',
      'cpr_first_aid',
      'cna_hha_license',
      'tb_test_screen',
      'physical_exam',
      'background_check_report',
      'auto_insurance',
      'direct_deposit_form',
      'w4_i9_form',
      'other_compliance_doc'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doc_verification_status_type') THEN
    CREATE TYPE doc_verification_status_type AS ENUM (
      'pending_upload',
      'under_review',
      'approved',
      'rejected',
      'expired'
    );
  END IF;
END $$;

-- Step 2: Create caregiver_documents table
CREATE TABLE IF NOT EXISTS public.caregiver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL REFERENCES public.caregiver_profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category document_category_type NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  issue_date DATE NULL,
  expiration_date DATE NULL,
  has_no_expiration BOOLEAN NOT NULL DEFAULT false,
  verification_status doc_verification_status_type NOT NULL DEFAULT 'under_review',
  rejection_reason TEXT NULL,
  reviewed_by UUID NULL,
  reviewed_at TIMESTAMPTZ NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  ocr_extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for caregiver_documents
CREATE INDEX IF NOT EXISTS idx_caregiver_docs_caregiver_cat ON public.caregiver_documents(caregiver_id, category);
CREATE INDEX IF NOT EXISTS idx_caregiver_docs_org_status ON public.caregiver_documents(org_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_caregiver_docs_expiration ON public.caregiver_documents(expiration_date) WHERE is_archived = false;

-- Auto-update trigger for caregiver_documents.updated_at
CREATE OR REPLACE FUNCTION update_caregiver_documents_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_caregiver_documents_updated_at ON public.caregiver_documents;
CREATE TRIGGER trg_caregiver_documents_updated_at
  BEFORE UPDATE ON public.caregiver_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_caregiver_documents_timestamp();

-- Step 3: Create document_audit_logs table
CREATE TABLE IF NOT EXISTS public.document_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.caregiver_documents(id) ON DELETE CASCADE,
  user_id UUID NULL,
  action VARCHAR(32) NOT NULL CHECK (action IN ('UPLOAD', 'VIEW_PREVIEW', 'DOWNLOAD', 'APPROVE', 'REJECT', 'EXPIRE')),
  ip_address INET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_audit_doc_created ON public.document_audit_logs(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_audit_action ON public.document_audit_logs(action, created_at DESC);

-- Step 4: Row-Level Security (RLS)
ALTER TABLE public.caregiver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to caregiver_documents for service_role" ON public.caregiver_documents;
CREATE POLICY "Allow all access to caregiver_documents for service_role"
  ON public.caregiver_documents
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to document_audit_logs for service_role" ON public.document_audit_logs;
CREATE POLICY "Allow all access to document_audit_logs for service_role"
  ON public.document_audit_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);
