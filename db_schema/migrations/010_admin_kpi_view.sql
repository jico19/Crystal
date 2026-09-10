-- ============================================================================
-- Migration 010: Admin Command Center KPI View & State Metrics (Spec 07)
-- ============================================================================

CREATE OR REPLACE VIEW public.admin_kpi_metrics AS
SELECT
  o.id AS org_id,
  o.name AS org_name,
  o.state_code,
  o.primary_domain,
  -- Caregiver counts
  COALESCE(cg.total_caregivers, 0) AS total_caregivers,
  COALESCE(cg.active_caregivers, 0) AS active_caregivers,
  COALESCE(cg.pending_onboarding_caregivers, 0) AS pending_onboarding_caregivers,
  -- Client counts
  COALESCE(cl.total_clients, 0) AS total_clients,
  COALESCE(cl.active_clients, 0) AS active_clients,
  COALESCE(cl.draft_intake_clients, 0) AS draft_intake_clients,
  -- Authorization counts
  COALESCE(auth.total_active_authorizations, 0) AS total_active_authorizations,
  COALESCE(auth.at_risk_authorizations, 0) AS at_risk_authorizations,
  COALESCE(auth.total_units_authorized, 0) AS total_units_authorized,
  COALESCE(auth.total_units_used, 0) AS total_units_used,
  -- Document compliance counts
  COALESCE(doc.pending_document_reviews, 0) AS pending_document_reviews,
  COALESCE(doc.expired_documents_count, 0) AS expired_documents_count,
  -- E-Signature counts
  COALESCE(sig.pending_signatures_count, 0) AS pending_signatures_count,
  COALESCE(sig.completed_signatures_count, 0) AS completed_signatures_count
FROM public.organizations o

-- Aggregate caregivers per org
LEFT JOIN (
  SELECT
    org_id,
    COUNT(*)::int AS total_caregivers,
    COUNT(*) FILTER (WHERE application_status = 'approved')::int AS active_caregivers,
    COUNT(*) FILTER (WHERE application_status IN ('draft', 'submitted'))::int AS pending_onboarding_caregivers
  FROM public.caregiver_profiles
  GROUP BY org_id
) cg ON cg.org_id = o.id

-- Aggregate clients per org
LEFT JOIN (
  SELECT
    org_id,
    COUNT(*)::int AS total_clients,
    COUNT(*) FILTER (WHERE status = 'active')::int AS active_clients,
    COUNT(*) FILTER (WHERE status = 'intake_draft')::int AS draft_intake_clients
  FROM public.clients
  GROUP BY org_id
) cl ON cl.org_id = o.id

-- Aggregate authorizations per org
LEFT JOIN (
  SELECT
    org_id,
    COUNT(*) FILTER (WHERE status = 'active')::int AS total_active_authorizations,
    COUNT(*) FILTER (WHERE status IN ('expiring_soon', 'exhausted'))::int AS at_risk_authorizations,
    COALESCE(SUM(total_units_authorized), 0)::bigint AS total_units_authorized,
    COALESCE(SUM(total_units_used), 0)::bigint AS total_units_used
  FROM public.client_authorizations
  GROUP BY org_id
) auth ON auth.org_id = o.id

-- Aggregate documents per org
LEFT JOIN (
  SELECT
    org_id,
    COUNT(*) FILTER (WHERE verification_status = 'under_review')::int AS pending_document_reviews,
    COUNT(*) FILTER (WHERE verification_status = 'expired')::int AS expired_documents_count
  FROM public.caregiver_documents
  GROUP BY org_id
) doc ON doc.org_id = o.id

-- Aggregate e-signatures per org
LEFT JOIN (
  SELECT
    org_id,
    COUNT(*) FILTER (WHERE status IN ('draft', 'sent'))::int AS pending_signatures_count,
    COUNT(*) FILTER (WHERE status = 'signed')::int AS completed_signatures_count
  FROM public.signature_envelopes
  GROUP BY org_id
) sig ON sig.org_id = o.id;
