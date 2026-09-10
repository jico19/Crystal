export interface AdminKpiMetrics {
  org_id: string;
  org_name: string;
  state_code: string;
  primary_domain: string;
  total_caregivers: number;
  active_caregivers: number;
  pending_onboarding_caregivers: number;
  total_clients: number;
  active_clients: number;
  draft_intake_clients: number;
  total_active_authorizations: number;
  at_risk_authorizations: number;
  total_units_authorized: number;
  total_units_used: number;
  pending_document_reviews: number;
  expired_documents_count: number;
  pending_signatures_count: number;
  completed_signatures_count: number;
}

export interface AggregatedKpis {
  total_caregivers: number;
  active_caregivers: number;
  total_clients: number;
  active_clients: number;
  total_active_authorizations: number;
  at_risk_authorizations: number;
  pending_document_reviews: number;
  expired_documents_count: number;
  pending_signatures_count: number;
  state_breakdown: AdminKpiMetrics[];
}

export interface UrgentActionItem {
  id: string;
  type: 'expiring_auth' | 'document_review' | 'expired_credential' | 'pending_signature';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  state_code: string;
  created_at: string;
}
