export type StateCode = 'GA' | 'IN' | 'FL';

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
  state_code: StateCode;
  domain: string;
  license_number: string;
  contact_phone: string;
  contact_email: string;
  emergency_phone?: string;
  office_address: OfficeAddress;
  office_hours: string;
  branding_theme: BrandingTheme;
  enabled_services: EnabledService[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type InquiryType = 'caregiver_inquiry' | 'client_care_inquiry' | 'general_question';
export type InquiryStatus = 'new' | 'contacted' | 'converted' | 'archived';

export interface PublicInquiry {
  id: string;
  org_id: string;
  state_code: StateCode;
  full_name: string;
  email: string;
  phone: string;
  inquiry_type: InquiryType;
  message: string;
  source_url: string;
  ip_address?: string;
  status: InquiryStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type UserRole =
  | 'super_admin'
  | 'state_admin'
  | 'agency_staff'
  | 'training_admin'
  | 'caregiver'
  | 'client';

export interface UserProfile {
  id: string;
  org_id?: string;
  role: UserRole;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  status: 'pending' | 'active' | 'suspended' | 'archived';
  mfa_enabled: boolean;
  created_at: string;
}

// ============================================================
// Caregiver Application & Onboarding Types (Feature Spec 02)
// ============================================================

export type CaregiverStatusType =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'additional_info_requested'
  | 'approved'
  | 'rejected'
  | 'archived';

export type OnboardingStepStatusType =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'verified'
  | 'rejected';

export type CaregiverPositionType = 'cna' | 'hha' | 'companion' | 'pca' | 'rn' | 'lpn';

export type LicenseType = 'CNA' | 'HHA' | 'LPN' | 'RN' | 'CPR' | 'PCA';

export type ShiftType = 'mornings' | 'afternoons' | 'evenings' | 'overnights' | 'live_in';

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface CaregiverAddress {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
}

export interface CaregiverPersonalInfo {
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone: string;
  dob: string; // YYYY-MM-DD
  ssn_last4?: string; // Display only — last 4 digits
  ssn_encrypted?: string; // Encrypted blob — never returned to client
  address: CaregiverAddress;
}

export interface CaregiverAvailability {
  full_time: boolean;
  part_time: boolean;
  prn: boolean;
  days_available: DayOfWeek[];
  shifts_available: ShiftType[];
  max_weekly_hours: number;
  willing_to_travel_miles: number;
}

export interface WorkExperienceItem {
  employer_name: string;
  job_title: string;
  start_date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD or undefined if current
  reason_for_leaving?: string;
  supervisor_contact?: string;
}

export interface ReferenceItem {
  name: string;
  relationship: 'professional' | 'personal' | 'supervisor';
  phone: string;
  email?: string;
  years_known: number;
}

export interface ProfessionalLicenseItem {
  license_type: LicenseType;
  license_number: string;
  issuing_state: string;
  expiration_date: string; // YYYY-MM-DD
}

export interface LegalDisclosures {
  authorized_to_work_in_us: true;
  felony_conviction: boolean;
  felony_explanation?: string;
  drug_screen_consent: true;
  background_check_consent: true;
  attestation_signature: string;
  attestation_timestamp: string; // ISO datetime
  signature_base64?: string;
}

export interface OnboardingChecklist {
  application_form: OnboardingStepStatusType;
  id_documents: OnboardingStepStatusType;
  background_check: OnboardingStepStatusType;
  tb_physical: OnboardingStepStatusType;
  in_service_orientation: OnboardingStepStatusType;
  direct_deposit_w4: OnboardingStepStatusType;
  final_admin_approval: OnboardingStepStatusType;
}

export interface CaregiverProfile {
  id: string;
  user_id: string;
  org_id: string;
  state_code: StateCode;
  application_status: CaregiverStatusType;
  application_step: number; // 1–5
  personal_info: CaregiverPersonalInfo;
  positions_applied: CaregiverPositionType[];
  availability: CaregiverAvailability;
  experience_history: WorkExperienceItem[];
  professional_licenses: ProfessionalLicenseItem[];
  references: ReferenceItem[];
  legal_disclosures: Partial<LegalDisclosures>;
  onboarding_checklist: OnboardingChecklist;
  assigned_coordinator_id?: string;
  rejection_reason?: string;
  submitted_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SaveCaregiverDraftPayload {
  step: 1 | 2 | 3 | 4 | 5;
  org_id: string;
  state_code: StateCode;
  data: Record<string, unknown>;
}

export interface CaregiverDraftResponse {
  success: boolean;
  profile?: Partial<CaregiverProfile>;
  error?: string;
}

export interface CaregiverSubmitResponse {
  success: boolean;
  application_id?: string;
  error?: string;
}

// ============================================================
// E-Signature & Agreement Types (Feature Spec 09)
// ============================================================

export type EsignEnvelopeStatus =
  | 'draft'
  | 'sent'
  | 'partially_signed'
  | 'completed'
  | 'declined'
  | 'voided';

export type SignerRole = 'caregiver' | 'client_rep' | 'agency_director';

export interface SignatureEnvelope {
  id: string;
  org_id: string;
  title: string;
  template_type: 'caregiver_onboarding_packet' | 'client_service_agreement';
  status: EsignEnvelopeStatus;
  signer_role: SignerRole;
  signer_user_id?: string;
  signer_name: string;
  signer_email: string;
  signature_base64?: string;
  signed_document_hash?: string; // SHA-256 cryptographic stamp
  ip_address?: string;
  user_agent?: string;
  signed_at?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Caregiver Documents & Credential Tracking (Feature Spec 03)
// ============================================================

export type DocumentCategoryType =
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

export type DocVerificationStatusType =
  | 'pending_upload'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'expired';

export interface OcrExtractedData {
  license_number?: string;
  issuer?: string;
  issue_date?: string;
  expiration_date?: string;
  confidence_score: number; // 0.0 - 1.0
  detected_category?: DocumentCategoryType;
  raw_text_snippet?: string;
}

export interface CaregiverDocument {
  id: string;
  caregiver_id: string;
  org_id: string;
  category: DocumentCategoryType;
  file_storage_path: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  issue_date?: string;
  expiration_date?: string;
  has_no_expiration: boolean;
  verification_status: DocVerificationStatusType;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  ocr_extracted_data?: OcrExtractedData;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  days_until_expiration?: number;
  is_expiring_soon?: boolean;
}

export type DocumentAuditActionType =
  | 'UPLOAD'
  | 'VIEW_PREVIEW'
  | 'DOWNLOAD'
  | 'APPROVE'
  | 'REJECT'
  | 'EXPIRE';

export interface DocumentAuditLog {
  id: string;
  document_id: string;
  user_id: string;
  action: DocumentAuditActionType;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface ComplianceScore {
  caregiver_id: string;
  score_percentage: number;
  total_required: number;
  approved_count: number;
  under_review_count: number;
  rejected_count: number;
  expired_count: number;
  missing_count: number;
  expiring_soon_count: number; // <= 30 days
  missing_categories: DocumentCategoryType[];
  expiring_documents: CaregiverDocument[];
}

export interface DocumentUploadPayload {
  caregiver_id: string;
  category: DocumentCategoryType;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  file_base64?: string;
  issue_date?: string;
  expiration_date?: string;
  has_no_expiration?: boolean;
}

export interface DocumentReviewPayload {
  document_id: string;
  decision: 'approved' | 'rejected';
  rejection_reason?: string;
  corrected_expiration_date?: string;
}

// ============================================================
// Training Portal Types (Feature Spec 04)
// ============================================================
export type TrainingCategory =
  | 'hipaa'
  | 'infection_control'
  | 'elder_abuse'
  | 'client_rights'
  | 'emergency'
  | 'dementia'
  | 'body_mechanics';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
}

export interface TrainingModule {
  id: string;
  org_id?: string | null;
  state_code: 'GA' | 'IN' | 'FL' | 'ALL';
  title: string;
  description: string;
  category: TrainingCategory;
  video_url: string;
  video_duration_seconds: number;
  required_hours: number;
  passing_score_percentage: number;
  quiz_questions: QuizQuestion[];
  is_mandatory: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CaregiverTrainingProgress {
  id: string;
  caregiver_id: string;
  module_id: string;
  watch_progress_percentage: number;
  video_completed: boolean;
  quiz_attempts: number;
  quiz_score_percentage?: number | null;
  passed: boolean;
  certificate_url?: string | null;
  certificate_hash?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizAnswerSubmission {
  question_id: string;
  selected_index: number;
}

export interface QuizSubmissionPayload {
  caregiver_id: string;
  module_id: string;
  answers: QuizAnswerSubmission[];
}

export interface VideoProgressPayload {
  caregiver_id: string;
  module_id: string;
  watch_progress_seconds: number;
  total_duration_seconds: number;
}

export interface QuizResultResponse {
  success: boolean;
  module_id: string;
  score_percentage: number;
  passing_score: number;
  passed: boolean;
  total_questions: number;
  correct_count: number;
  certificate_url?: string;
  certificate_hash?: string;
  message: string;
}

export interface TrainingComplianceSummary {
  caregiver_id: string;
  completed_modules_count: number;
  total_mandatory_modules: number;
  total_earned_hours: number;
  required_annual_hours: number;
  compliance_percentage: number;
  is_compliant: boolean;
}

// ============================================================
// Client Intake & Document Management Types (Feature Spec 05)
// ============================================================
export type ClientStatus =
  | 'inquiry'
  | 'intake_pending'
  | 'assessment_scheduled'
  | 'active'
  | 'on_hold'
  | 'discharged';

export type PayerType =
  | 'medicaid_waiver'
  | 'private_pay'
  | 'va_community_care'
  | 'long_term_care_insurance'
  | 'commercial_insurance';

export interface ClientAddress {
  street: string;
  apt?: string;
  city: string;
  state: string;
  zip: string;
  gate_code?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  is_primary: boolean;
  has_poa: boolean;
}

export interface PrimaryPhysician {
  name: string;
  practice?: string;
  phone: string;
  fax?: string;
  npi?: string;
}

export interface CareNeeds {
  adls: string[];
  iadls: string[];
  allergies: string[];
  diagnoses: string[];
  mobility_notes?: string;
  dietary_restrictions?: string;
}

export interface PayerDetails {
  policy_number?: string;
  group_number?: string;
  case_manager_name?: string;
  case_manager_phone?: string;
  pre_auth_number?: string;
}

export interface ClientProfile {
  id: string;
  org_id: string;
  state_code: StateCode;
  status: ClientStatus;
  first_name: string;
  middle_name?: string;
  last_name: string;
  dob: string;
  gender?: string;
  ssn_last4?: string;
  medicaid_id?: string;
  primary_phone: string;
  service_address: ClientAddress;
  emergency_contacts: EmergencyContact[];
  primary_physician: PrimaryPhysician;
  care_needs: CareNeeds;
  primary_payer: PayerType;
  payer_details?: PayerDetails;
  assigned_rn_id?: string;
  created_at: string;
  updated_at: string;
}

export type ClientDocType =
  | 'physician_orders_485'
  | 'rn_assessment'
  | 'service_agreement'
  | 'insurance_card'
  | 'poa_legal';

export interface ClientDocument {
  id: string;
  client_id: string;
  org_id: string;
  doc_type: ClientDocType;
  file_storage_path: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  effective_date?: string;
  expiration_date?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface ClientIntakeInput {
  org_id: string;
  state_code: StateCode;
  first_name: string;
  middle_name?: string;
  last_name: string;
  dob: string;
  gender?: string;
  ssn_last4?: string;
  medicaid_id?: string;
  primary_phone: string;
  service_address: ClientAddress;
  emergency_contacts: EmergencyContact[];
  primary_physician: PrimaryPhysician;
  care_needs: CareNeeds;
  primary_payer: PayerType;
  payer_details?: PayerDetails;
}



