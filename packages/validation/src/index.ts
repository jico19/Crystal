import { z } from 'zod';

// ============================================================================
// Office Address Schema
// ============================================================================
export const OfficeAddressSchema = z.object({
  street: z.string().min(3, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().length(2, 'State code must be 2 letters'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Valid US ZIP code required'),
});

// ============================================================================
// Branding Theme Schema
// ============================================================================
export const BrandingThemeSchema = z.object({
  primary_color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color'),
  secondary_color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color'),
  accent_color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color'),
  logo_url: z.string().min(1, 'Logo URL is required'),
  favicon_url: z.string().min(1, 'Favicon URL is required'),
  hero_headline: z.string().min(5, 'Hero headline is required'),
  hero_subheading: z.string().min(10, 'Hero subheading is required'),
});

// ============================================================================
// Enabled Service Schema
// ============================================================================
export const EnabledServiceSchema = z.object({
  slug: z.string().min(2),
  title: z.string().min(3),
  description: z.string().min(10),
  icon_name: z.string().min(2),
});

// ============================================================================
// Organization Master Schema
// ============================================================================
export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  state_code: z.enum(['GA', 'IN', 'FL']),
  primary_domain: z.string(),
  subdomains: z.array(z.string()).default([]),
  license_number: z.string().min(1),
  contact_phone: z.string().min(7),
  contact_email: z.string().email(),
  emergency_phone: z.string().nullable().optional(),
  office_address: OfficeAddressSchema,
  office_hours: z.string(),
  branding_theme: BrandingThemeSchema,
  enabled_services: z.array(EnabledServiceSchema).default([]),
  is_active: z.boolean(),
  created_at: z.string().or(z.date()).transform((val: string | Date) => new Date(val).toISOString()),
  updated_at: z.string().or(z.date()).transform((val: string | Date) => new Date(val).toISOString()),
});

export type OrganizationInput = z.infer<typeof OrganizationSchema>;

// ============================================================================
// Create Public Inquiry / Lead Schema
// ============================================================================
export const CreatePublicInquirySchema = z.object({
  org_id: z.string().uuid('Invalid organization ID'),
  state_code: z.enum(['GA', 'IN', 'FL']),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^\+?1?\s*\(?-*\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4}$/, 'Invalid US phone number'),
  inquiry_type: z.enum(['caregiver_inquiry', 'client_care_inquiry', 'general_question'], {
    required_error: 'Please select an inquiry type',
  }),
  message: z.string().min(10, 'Message must contain at least 10 characters').max(2000, 'Message cannot exceed 2000 characters'),
  source_url: z.string().url('Source URL must be a valid URL'),
  honeypot: z.string().max(0, 'Spam detected').optional(),
});

export type CreatePublicInquiryInput = z.infer<typeof CreatePublicInquirySchema>;

// ============================================================================
// Step 1: Personal Information Schema (Spec 02)
// ============================================================================
function isAtLeast18YearsOld(dobString: string): boolean {
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 18;
}

export const PersonalInfoStepSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters').max(50),
  middle_name: z.string().max(50).optional(),
  last_name: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^\+?1?\s*\(?-*\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4}$/, 'Invalid US phone number'),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
    .refine(isAtLeast18YearsOld, {
      message: 'Applicant must be at least 18 years old',
    }),
  ssn: z
    .string()
    .regex(/^\d{3}-?\d{2}-?\d{4}$/, 'Valid 9-digit SSN required (e.g. 123-45-6789)'),
  address: z.object({
    street: z.string().min(3, 'Street address is required'),
    unit: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    state: z.string().length(2, 'State must be a 2-letter abbreviation'),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Valid 5 or 9-digit ZIP code required'),
  }),
});

export type PersonalInfoStepInput = z.infer<typeof PersonalInfoStepSchema>;

export const CreateDraftApplicationSchema = z.object({
  org_id: z.string().uuid('Invalid organization ID'),
  state_code: z.enum(['GA', 'IN', 'FL']),
  personal_info: PersonalInfoStepSchema,
});

export type CreateDraftApplicationInput = z.infer<typeof CreateDraftApplicationSchema>;

// ============================================================================
// Step 2: Availability & Positions Schema
// ============================================================================
export const AvailabilityStepSchema = z.object({
  positions_applied: z
    .array(z.enum(['cna', 'hha', 'companion', 'pca', 'rn', 'lpn']))
    .min(1, 'Select at least one position'),
  availability: z.object({
    full_time: z.boolean(),
    part_time: z.boolean(),
    prn: z.boolean(),
    days_available: z
      .array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']))
      .min(1, 'Select at least one available day'),
    shifts_available: z
      .array(z.enum(['mornings', 'afternoons', 'evenings', 'overnights', 'live_in']))
      .min(1, 'Select at least one shift preference'),
    max_weekly_hours: z.number().min(1).max(80),
    willing_to_travel_miles: z.number().min(1).max(100),
  }),
});

export type AvailabilityStepInput = z.infer<typeof AvailabilityStepSchema>;

// ============================================================================
// Step 3: Experience & References Schema
// ============================================================================
export const WorkHistoryItemSchema = z.object({
  employer_name: z.string().min(2, 'Employer name is required'),
  job_title: z.string().min(2, 'Job title is required'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid start date required (YYYY-MM-DD)'),
  end_date: z
    .union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid end date required (YYYY-MM-DD)'),
      z.literal(''),
    ])
    .optional(),
  reason_for_leaving: z.string().optional(),
  supervisor_contact: z.string().optional(),
});

export const ReferenceItemSchema = z.object({
  name: z.string().min(2, 'Reference name is required'),
  relationship: z.enum(['professional', 'personal', 'supervisor']),
  phone: z.string().regex(/^\+?1?\s*\(?-*\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4}$/, 'Valid US phone number required'),
  email: z
    .union([
      z.string().email('Valid email address required'),
      z.literal(''),
    ])
    .optional(),
  years_known: z.coerce.number().min(0.5, 'Years known must be at least 0.5'),
});

export const ExperienceStepSchema = z.object({
  experience_history: z.array(WorkHistoryItemSchema).min(1, 'At least 1 previous work experience is required'),
  references: z.array(ReferenceItemSchema).min(2, 'At least 2 professional/personal references are required'),
});

export type ExperienceStepInput = z.infer<typeof ExperienceStepSchema>;

// ============================================================================
// Step 4: Professional Licensure Schema (Optional Array)
// ============================================================================
export const LicenseItemSchema = z.object({
  license_type: z.enum(['CNA', 'HHA', 'LPN', 'RN', 'CPR', 'PCA']),
  license_number: z.string().min(2, 'License number is required'),
  issuing_state: z.string().length(2, 'State must be a 2-letter code'),
  expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid expiration date required (YYYY-MM-DD)'),
});

export const LicensesStepSchema = z.object({
  professional_licenses: z.array(LicenseItemSchema).default([]),
});

export type LicensesStepInput = z.infer<typeof LicensesStepSchema>;

// ============================================================================
// Step 5: Legal Disclosures & Attestation Schema
// ============================================================================
export const LegalDisclosuresStepSchema = z
  .object({
    authorized_to_work_in_us: z.literal(true, {
      errorMap: () => ({ message: 'You must be authorized to work in the US' }),
    }),
    felony_conviction: z.boolean(),
    felony_explanation: z.string().optional(),
    drug_screen_consent: z.literal(true, {
      errorMap: () => ({ message: 'Consent to drug screening is required' }),
    }),
    background_check_consent: z.literal(true, {
      errorMap: () => ({ message: 'Consent to background check is required' }),
    }),
    attestation_signature: z.string().min(3, 'Typed legal name signature is required (min 3 characters)'),
    attestation_timestamp: z.string().min(10, 'Attestation timestamp is required'),
  })
  .refine(
    (data) => {
      if (data.felony_conviction) {
        return !!data.felony_explanation && data.felony_explanation.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Please provide an explanation for the felony conviction disclosure',
      path: ['felony_explanation'],
    }
  );

export type LegalDisclosuresStepInput = z.infer<typeof LegalDisclosuresStepSchema>;

// ============================================================================
// Complete Caregiver Application Schema (Whole-profile validation on submit)
// ============================================================================
export const CompleteCaregiverApplicationSchema = z.object({
  personal_info: z.object({
    first_name: z.string().min(2),
    last_name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(7),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    ssn_last4: z.string().length(4),
    address: z.object({
      street: z.string().min(3),
      city: z.string().min(2),
      state: z.string().length(2),
      zip: z.string().min(5),
    }),
  }),
  positions_applied: z.array(z.string()).min(1, 'Positions applied is required'),
  availability: z.object({
    full_time: z.boolean(),
    part_time: z.boolean(),
    prn: z.boolean(),
    days_available: z.array(z.string()).min(1),
    shifts_available: z.array(z.string()).min(1),
    max_weekly_hours: z.number().min(1),
    willing_to_travel_miles: z.number().min(1),
  }),
  experience_history: z.array(z.any()).min(1, 'Experience history is required'),
  references: z.array(z.any()).min(2, 'At least 2 references are required'),
  professional_licenses: z.array(z.any()).default([]),
  legal_disclosures: LegalDisclosuresStepSchema,
});

export type CompleteCaregiverApplicationInput = z.infer<typeof CompleteCaregiverApplicationSchema>;

// ============================================================================
// Discriminated Union for PUT /application/draft
// ============================================================================
export const SaveDraftStepSchema = z.discriminatedUnion('step', [
  z.object({
    step: z.literal(2),
    data: AvailabilityStepSchema,
  }),
  z.object({
    step: z.literal(3),
    data: ExperienceStepSchema,
  }),
  z.object({
    step: z.literal(4),
    data: LicensesStepSchema,
  }),
]);

export type SaveDraftStepInput = z.infer<typeof SaveDraftStepSchema>;

// ============================================================================
// Spec 10: RBAC, Users & Audit Trail Schemas
// ============================================================================
export const UserRoleSchema = z.enum([
  'super_admin',
  'agency_admin',
  'care_coordinator',
  'registered_nurse',
  'caregiver',
]);

export type UserRoleInput = z.infer<typeof UserRoleSchema>;

export const AuditLogQuerySchema = z.object({
  event_type: z
    .enum([
      'AUTH_LOGIN',
      'AUTH_FAILED',
      'AUTH_LOCKOUT',
      'PHI_ACCESS',
      'PII_DECRYPT',
      'RECORD_MUTATION',
      'SECURITY_VIOLATION',
      'DOCUMENT_DOWNLOAD',
      'ROLE_CHANGE',
    ])
    .optional(),
  org_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(25),
});

export type AuditLogQueryInput = z.infer<typeof AuditLogQuerySchema>;

export const UpdateUserRoleSchema = z.object({
  role: UserRoleSchema,
  state_code: z.enum(['GA', 'IN', 'FL', 'ALL']).optional(),
});

export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;

export const UpdateUserStatusSchema = z.object({
  is_active: z.boolean(),
  reason: z.string().optional(),
});

export type UpdateUserStatusInput = z.infer<typeof UpdateUserStatusSchema>;

// ============================================================================
// Spec 03: Caregiver Documents & Credential Tracking Schemas
// ============================================================================
export const DocumentCategorySchema = z.enum([
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
  'other_compliance_doc',
]);

export const RequestUploadUrlSchema = z.object({
  caregiver_id: z.string().uuid(),
  category: DocumentCategorySchema,
  file_name: z.string().min(1).max(255),
  mime_type: z.string().regex(/^(image\/[a-z0-9.-]+|application\/pdf)$/, 'Only PDF or images permitted'),
  file_size_bytes: z.number().int().positive().max(25 * 1024 * 1024, 'Max file size 25MB'),
  expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiration date must be YYYY-MM-DD').optional(),
});

export type RequestUploadUrlInput = z.infer<typeof RequestUploadUrlSchema>;

export const ConfirmUploadSchema = z.object({
  storage_path: z.string().min(1),
  expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type ConfirmUploadInput = z.infer<typeof ConfirmUploadSchema>;

export const ReviewDocumentSchema = z.object({
  verification_status: z.enum(['approved', 'rejected']),
  rejection_reason: z.string().min(3).optional(),
}).refine(
  (data) => {
    if (data.verification_status === 'rejected') {
      return !!data.rejection_reason && data.rejection_reason.trim().length > 0;
    }
    return true;
  },
  {
    message: 'Rejection reason is mandatory when rejecting a document',
    path: ['rejection_reason'],
  }
);

export type ReviewDocumentInput = z.infer<typeof ReviewDocumentSchema>;

// ============================================================================
// Spec 04: In-Service Training Portal Schemas
// ============================================================================
export const VideoProgressUpdateSchema = z.object({
  module_id: z.string().uuid(),
  watched_seconds: z.number().min(0),
  delta_seconds: z.number().min(0).max(60, 'Video progress update exceeds permitted rate'),
});

export type VideoProgressUpdateInput = z.infer<typeof VideoProgressUpdateSchema>;

export const QuizSubmissionSchema = z.object({
  module_id: z.string().uuid(),
  answers: z.record(z.string(), z.number().int().min(0)), // question_id -> selected_option_index
});

export type QuizSubmissionInput = z.infer<typeof QuizSubmissionSchema>;

// ============================================================================
// Spec 05: Client Intake Schemas
// ============================================================================
export const ClientEmergencyContactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  relationship: z.string().min(2, 'Relationship is required'),
  phone: z.string().regex(/^\+?1?\s*\(?-*\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4}$/, 'Valid phone required'),
  alternate_phone: z.string().optional(),
  is_primary: z.boolean().default(false),
});

export const CreateClientIntakeSchema = z.object({
  org_id: z.string().uuid(),
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['male', 'female', 'other']),
  medicaid_id: z.string().min(4).optional(),
  service_address: OfficeAddressSchema,
  emergency_contacts: z.array(ClientEmergencyContactSchema).min(1, 'At least 1 emergency contact is required'),
  care_needs: z.object({
    primary_diagnosis: z.string().optional(),
    mobility_assistance: z.boolean().default(false),
    bathing_dressing: z.boolean().default(false),
    meal_prep: z.boolean().default(false),
    medication_reminders: z.boolean().default(false),
    notes: z.string().optional(),
  }),
  payer_details: z.object({
    payer_name: z.string().min(2),
    plan_type: z.string().min(2),
    policy_number: z.string().optional(),
    coordinator_name: z.string().optional(),
    coordinator_phone: z.string().optional(),
  }),
});

export type CreateClientIntakeInput = z.infer<typeof CreateClientIntakeSchema>;

export const UpdateClientStatusSchema = z.object({
  status: z.enum(['intake_draft', 'submitted', 'active', 'suspended', 'discharged']),
  notes: z.string().optional(),
});

export type UpdateClientStatusInput = z.infer<typeof UpdateClientStatusSchema>;

// ============================================================================
// Spec 06: Client Prior Authorization Schemas
// ============================================================================
export const CreateAuthorizationSchema = z.object({
  client_id: z.string().uuid(),
  auth_number: z.string().min(3),
  payer_id: z.string().min(2),
  service_code: z.string().default('T1019'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_units_authorized: z.number().int().positive('Total units must be positive (1 unit = 15m)'),
  weekly_unit_cap: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export type CreateAuthorizationInput = z.infer<typeof CreateAuthorizationSchema>;

export const UpdateAuthorizationUnitsSchema = z.object({
  units_used_delta: z.number().int().min(1, 'Increment must be at least 1 unit'),
  service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().optional(),
});

export type UpdateAuthorizationUnitsInput = z.infer<typeof UpdateAuthorizationUnitsSchema>;

// ============================================================================
// Spec 08: Notification Engine Schemas
// ============================================================================
export const QueueNotificationSchema = z.object({
  org_id: z.string().uuid(),
  recipient_user_id: z.string().uuid().optional(),
  channel: z.enum(['email', 'sms', 'in_app']),
  destination: z.string().min(3),
  subject: z.string().optional(),
  payload: z.record(z.string(), z.unknown()),
});

export type QueueNotificationInput = z.infer<typeof QueueNotificationSchema>;

// ============================================================================
// Spec 09: E-Signature Schemas
// ============================================================================
export const CreateEnvelopeSchema = z.object({
  org_id: z.string().uuid(),
  title: z.string().min(3),
  document_type: z.string().min(2),
  related_entity_id: z.string().uuid(),
  recipient_email: z.string().email(),
  recipient_name: z.string().min(2),
});

export type CreateEnvelopeInput = z.infer<typeof CreateEnvelopeSchema>;

export const SubmitSignatureSchema = z.object({
  signature_data_url: z.string().min(20, 'Signature image is required'),
  consent_given: z.literal(true, {
    errorMap: () => ({ message: 'Electronic signature consent is required' }),
  }),
  full_legal_name: z.string().min(2),
});

export type SubmitSignatureInput = z.infer<typeof SubmitSignatureSchema>;

