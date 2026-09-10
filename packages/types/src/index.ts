// ============================================================================
// @crystal/types — Shared Types & API Models
// ============================================================================

export interface OfficeAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface BrandingTheme {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string;
  favicon_url: string;
  hero_headline: string;
  hero_subheading: string;
}

export interface EnabledService {
  slug: string;
  title: string;
  description: string;
  icon_name: string;
}

export interface Organization {
  id: string;
  name: string;
  state_code: 'GA' | 'IN' | 'FL';
  primary_domain: string;
  subdomains: string[];
  license_number: string;
  contact_phone: string;
  contact_email: string;
  emergency_phone?: string | null;
  office_address: OfficeAddress;
  office_hours: string;
  branding_theme: BrandingTheme;
  enabled_services: EnabledService[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Spec 10: RBAC, Users & Security Audit Trail
// ============================================================================

export type UserRole =
  | 'super_admin'
  | 'agency_admin'
  | 'care_coordinator'
  | 'registered_nurse'
  | 'caregiver';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: UserRole;
  org_id?: string;
}

export interface UserProfile {
  id: string;
  org_id: string;
  role: UserRole;
  state_code: 'GA' | 'IN' | 'FL' | 'ALL';
  is_active: boolean;
  mfa_enabled: boolean;
  failed_login_attempts: number;
  locked_until?: string | null;
  created_at: string;
  updated_at: string;
}

export type SecurityAuditEventType =
  | 'AUTH_LOGIN'
  | 'AUTH_FAILED'
  | 'AUTH_LOCKOUT'
  | 'PHI_ACCESS'
  | 'PII_DECRYPT'
  | 'RECORD_MUTATION'
  | 'SECURITY_VIOLATION'
  | 'DOCUMENT_DOWNLOAD'
  | 'ROLE_CHANGE';

export interface SecurityAuditLog {
  id: string;
  user_id?: string | null;
  org_id?: string | null;
  event_type: SecurityAuditEventType;
  resource_type: string;
  resource_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// Spec 03: Caregiver Documents & Credential Tracking
// ============================================================================

export type DocumentCategory =
  | 'drivers_license'
  | 'social_security_card'
  | 'cpr_first_aid'
  | 'cna_hha_license'
  | 'tb_test_screen'
  | 'physical_exam'
  | 'background_check_report'
  | 'auto_insurance'
  | 'direct_deposit_form'
  | 'w4_i9_form'
  | 'other_compliance_doc';

export type VerificationStatus =
  | 'pending_upload'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'expired';

export interface CaregiverDocument {
  id: string;
  caregiver_id: string;
  org_id: string;
  category: DocumentCategory;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  issue_date?: string | null;
  expiration_date?: string | null;
  has_no_expiration?: boolean;
  verification_status: VerificationStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplianceScore {
  total_required: number;
  total_approved: number;
  total_pending: number;
  total_rejected: number;
  total_expired: number;
  compliance_percentage: number;
  is_compliant: boolean;
}

// ============================================================================
// Spec 04: In-Service Training Portal
// ============================================================================

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
}

export interface TrainingModule {
  id: string;
  org_id?: string | null;
  title: string;
  description: string;
  video_url: string;
  duration_seconds: number;
  passing_score_pct: number;
  required_hours?: number;
  quiz_questions: QuizQuestion[];
  is_mandatory: boolean;
  state_code?: string;
  created_at: string;
}

export interface CaregiverTrainingProgress {
  id: string;
  caregiver_id: string;
  module_id: string;
  watch_progress_seconds: number;
  watch_progress_percentage: number;
  video_completed: boolean;
  is_completed?: boolean;
  quiz_attempts: number;
  highest_score: number;
  passed: boolean;
  completed_at?: string | null;
  certificate_issued_at?: string | null;
  certificate_hash?: string | null;
}

export interface CertificateDetails {
  certificate_id: string;
  caregiver_id: string;
  caregiver_name: string;
  module_id: string;
  module_title: string;
  required_hours: number;
  passing_score_pct: number;
  highest_score: number;
  completed_at: string;
  certificate_hash: string;
  organization_name: string;
  state_code: string;
}


// ============================================================================
// Spec 05: Client Intake & Clinical Documents
// ============================================================================

export type ClientStatus = 'intake_draft' | 'submitted' | 'active' | 'suspended' | 'discharged';

export interface ClientEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternate_phone?: string;
  is_primary: boolean;
}

export interface ClientProfile {
  id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  medicaid_id?: string | null;
  status: ClientStatus;
  service_address: OfficeAddress;
  emergency_contacts: ClientEmergencyContact[];
  care_needs: {
    primary_diagnosis?: string;
    mobility_assistance?: boolean;
    bathing_dressing?: boolean;
    meal_prep?: boolean;
    medication_reminders?: boolean;
    notes?: string;
  };
  payer_details: {
    payer_name: string;
    plan_type: string;
    policy_number?: string;
    coordinator_name?: string;
    coordinator_phone?: string;
  };
  created_at: string;
  updated_at: string;
}

export type ClientDocCategory =
  | 'assessment_485'
  | 'physician_order'
  | 'consent_packet'
  | 'insurance_card'
  | 'face_sheet';

export interface ClientDocument {
  id: string;
  client_id: string;
  org_id: string;
  category: ClientDocCategory;
  storage_path: string;
  file_name: string;
  mime_type: string;
  expiration_date?: string | null;
  uploaded_by: string;
  created_at: string;
}

// ============================================================================
// Spec 06: Client Prior Authorization & Utilization
// ============================================================================

export type AuthorizationStatus = 'active' | 'expiring_soon' | 'expired' | 'exhausted';

export interface ClientAuthorization {
  id: string;
  client_id: string;
  org_id: string;
  auth_number: string;
  payer_id: string;
  service_code: string; // e.g. T1019 Personal Care
  start_date: string;
  end_date: string;
  total_units_authorized: number; // 1 unit = 15 minutes
  total_units_used: number;
  weekly_unit_cap?: number | null;
  status: AuthorizationStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UnitBurndownSummary {
  authorization_id: string;
  client_name: string;
  service_code: string;
  total_units: number;
  used_units: number;
  remaining_units: number;
  utilization_percentage: number;
  days_remaining: number;
  is_at_risk: boolean;
}

// ============================================================================
// Spec 08: Notifications & Automation Engine
// ============================================================================

export type NotificationChannel = 'email' | 'sms' | 'in_app';
export type NotificationStatus = 'queued' | 'sent' | 'failed';

export interface NotificationQueueItem {
  id: string;
  org_id: string;
  recipient_user_id?: string | null;
  channel: NotificationChannel;
  destination: string;
  subject?: string | null;
  payload: Record<string, unknown>;
  status: NotificationStatus;
  attempts: number;
  next_retry_at: string;
  error_log?: string | null;
  created_at: string;
}

export interface InAppNotification {
  id: string;
  user_id: string;
  org_id: string;
  title: string;
  body: string;
  action_url?: string | null;
  is_read: boolean;
  created_at: string;
}

// ============================================================================
// Spec 09: E-Signature Workflows
// ============================================================================

export type EnvelopeStatus = 'draft' | 'sent' | 'viewed' | 'completed' | 'declined' | 'voided';

export interface SignatureEnvelope {
  id: string;
  org_id: string;
  title: string;
  document_type: string;
  related_entity_id: string;
  recipient_email: string;
  recipient_name: string;
  status: EnvelopeStatus;
  signer_ip?: string | null;
  signature_image_path?: string | null;
  tamper_sha256_hash?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Spec 07: Admin Dashboard & State Reporting
// ============================================================================

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

export interface InAppNotificationItem {
  id: string;
  org_id: string;
  user_id: string;
  title: string;
  message: string;
  category: string;
  is_read: boolean;
  read_at?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
