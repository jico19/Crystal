-- ============================================================================
-- Migration 009: E-Signature Workflows & Audit Verification (Spec 09)
-- ============================================================================

-- Step 1: Create ENUM types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signature_envelope_status_type') THEN
    CREATE TYPE signature_envelope_status_type AS ENUM (
      'draft',
      'sent',
      'signed',
      'declined',
      'expired'
    );
  END IF;
END $$;

-- Step 2: Create signature_envelopes table
CREATE TABLE IF NOT EXISTS public.signature_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  related_entity_id UUID NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  status signature_envelope_status_type NOT NULL DEFAULT 'draft',
  signature_data_url TEXT NULL,
  full_legal_name TEXT NULL,
  consent_timestamp TIMESTAMPTZ NULL,
  signer_ip_address INET NULL,
  tamper_sha256 VARCHAR(64) NULL,
  signed_document_storage_path TEXT NULL,
  external_provider_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sig_envelopes_org_status ON public.signature_envelopes(org_id, status);
CREATE INDEX IF NOT EXISTS idx_sig_envelopes_email ON public.signature_envelopes(recipient_email);
CREATE INDEX IF NOT EXISTS idx_sig_envelopes_entity ON public.signature_envelopes(related_entity_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_signature_envelopes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_signature_envelopes_updated_at ON public.signature_envelopes;
CREATE TRIGGER trg_signature_envelopes_updated_at
  BEFORE UPDATE ON public.signature_envelopes
  FOR EACH ROW
  EXECUTE FUNCTION update_signature_envelopes_timestamp();

-- Step 3: Row-Level Security
ALTER TABLE public.signature_envelopes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to signature_envelopes for service_role" ON public.signature_envelopes;
CREATE POLICY "Allow all access to signature_envelopes for service_role"
  ON public.signature_envelopes
  FOR ALL
  USING (true)
  WITH CHECK (true);
