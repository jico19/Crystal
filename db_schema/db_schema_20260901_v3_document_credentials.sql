-- ============================================================================
-- Crystal Multi-State Home Care Platform
-- Migration: v3 - Caregiver Documents & Credential Tracking (Spec 03)
-- Description: Adds caregiver_documents and document_audit_logs tables,
--              OCR extraction metadata, expiration indexing, and RLS policies.
-- ============================================================================

-- Ensure uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Document Categories Enum
DO $$ BEGIN
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
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Verification Status Enum
DO $$ BEGIN
    CREATE TYPE doc_verification_status_type AS ENUM (
        'pending_upload',
        'under_review',
        'approved',
        'rejected',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- CAREGIVER DOCUMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.caregiver_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id TEXT NOT NULL,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    category document_category_type NOT NULL,
    file_storage_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    issue_date DATE,
    expiration_date DATE,
    has_no_expiration BOOLEAN NOT NULL DEFAULT false,
    verification_status doc_verification_status_type NOT NULL DEFAULT 'under_review',
    verified_by TEXT,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    ocr_extracted_data JSONB DEFAULT '{}'::jsonb,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- DOCUMENT AUDIT TRAIL TABLE (Immutable)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.document_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.caregiver_documents(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('UPLOAD', 'VIEW_PREVIEW', 'DOWNLOAD', 'APPROVE', 'REJECT', 'EXPIRE')),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_caregiver_docs_caregiver
    ON public.caregiver_documents(caregiver_id);

CREATE INDEX IF NOT EXISTS idx_caregiver_docs_org_category
    ON public.caregiver_documents(org_id, category);

CREATE INDEX IF NOT EXISTS idx_caregiver_docs_expiration
    ON public.caregiver_documents(expiration_date) WHERE is_archived = false;

CREATE INDEX IF NOT EXISTS idx_doc_audit_logs_document
    ON public.document_audit_logs(document_id);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.caregiver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_audit_logs ENABLE ROW LEVEL SECURITY;

-- Caregivers read own documents
CREATE POLICY "Caregivers read own documents"
ON public.caregiver_documents FOR SELECT
TO authenticated
USING (
    caregiver_id = auth.uid()::text
    OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('coordinator', 'agency_staff', 'state_admin', 'super_admin')
);

-- Caregivers insert own documents
CREATE POLICY "Caregivers insert own documents"
ON public.caregiver_documents FOR INSERT
TO authenticated
WITH CHECK (
    caregiver_id = auth.uid()::text
);

-- Staff review and update documents
CREATE POLICY "Staff review and update documents"
ON public.caregiver_documents FOR UPDATE
TO authenticated
USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('coordinator', 'agency_staff', 'state_admin', 'super_admin')
    OR caregiver_id = auth.uid()::text
);
