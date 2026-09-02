-- ============================================================================
-- Crystal Home Health Platform
-- Database Migration Snapshot: Feature Spec 07 (Admin Command Center & State Reporting)
-- Generated: 2026-09-02
-- Target: PostgreSQL 15+ / Supabase / PGlite
-- ============================================================================

-- Aggregated State KPI View across Caregivers, Documents, Clients, and Authorizations
CREATE OR REPLACE VIEW public.view_admin_state_kpis AS
SELECT
    o.id AS org_id,
    o.state_code,
    o.name AS organization_name,
    COUNT(DISTINCT cp.id) FILTER (WHERE cp.application_status = 'approved') AS active_caregivers_count,
    COUNT(DISTINCT cp.id) FILTER (WHERE cp.application_status = 'submitted') AS pending_applications_count,
    COUNT(DISTINCT cd.id) FILTER (WHERE cd.verification_status = 'under_review') AS pending_document_reviews_count,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') AS active_clients_count,
    COUNT(DISTINCT ca.id) FILTER (WHERE ca.status = 'expiring_soon' OR (ca.end_date <= CURRENT_DATE + INTERVAL '60 days' AND ca.status != 'closed')) AS expiring_authorizations_count,
    COALESCE(SUM(ca.total_units_authorized), 0) AS total_units_authorized,
    COALESCE(SUM(ca.total_units_used), 0) AS total_units_used
FROM public.organizations o
LEFT JOIN public.caregiver_profiles cp ON cp.org_id = o.id
LEFT JOIN public.caregiver_documents cd ON cd.org_id = o.id
LEFT JOIN public.clients c ON c.org_id = o.id
LEFT JOIN public.client_authorizations ca ON ca.org_id = o.id
GROUP BY o.id, o.state_code, o.name;

-- Work Queue View: Caregivers Pending Application Review
CREATE OR REPLACE VIEW public.view_admin_pending_applications AS
SELECT
    cp.id AS caregiver_id,
    cp.org_id,
    cp.state_code,
    o.name AS organization_name,
    cp.first_name,
    cp.last_name,
    cp.email,
    cp.phone,
    cp.positions_applied,
    cp.application_status,
    cp.created_at,
    cp.updated_at
FROM public.caregiver_profiles cp
JOIN public.organizations o ON o.id = cp.org_id
WHERE cp.application_status = 'submitted';

-- Work Queue View: Caregiver Documents Pending Credential Review
CREATE OR REPLACE VIEW public.view_admin_pending_documents AS
SELECT
    cd.id AS document_id,
    cd.caregiver_id,
    cd.org_id,
    cd.state_code,
    o.name AS organization_name,
    cd.doc_type,
    cd.file_name,
    cd.verification_status,
    cd.expiration_date,
    cd.created_at
FROM public.caregiver_documents cd
JOIN public.organizations o ON o.id = cd.org_id
WHERE cd.verification_status = 'under_review';
