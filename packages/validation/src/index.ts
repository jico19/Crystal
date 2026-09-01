import { z } from 'zod';

export const OfficeAddressSchema = z.object({
  street: z.string().min(3, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().length(2, 'State code must be 2 characters'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Valid US ZIP code required'),
});

export const BrandingThemeSchema = z.object({
  primary_color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color'),
  secondary_color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color'),
  accent_color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color'),
  logo_url: z.string().url('Invalid logo URL'),
  favicon_url: z.string().url('Invalid favicon URL'),
  hero_headline: z.string().min(5, 'Hero headline is required'),
  hero_subheading: z.string().min(10, 'Hero subheading is required'),
});

export const EnabledServiceSchema = z.object({
  slug: z.string().min(2),
  title: z.string().min(3),
  description: z.string().min(10),
  icon_name: z.string().min(2),
});

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  state_code: z.enum(['GA', 'IN', 'FL']),
  domain: z.string(),
  license_number: z.string().min(1),
  contact_phone: z.string().min(10),
  contact_email: z.string().email(),
  emergency_phone: z.string().optional(),
  office_address: OfficeAddressSchema,
  office_hours: z.string(),
  branding_theme: BrandingThemeSchema,
  enabled_services: z.array(EnabledServiceSchema),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreatePublicInquirySchema = z.object({
  org_id: z.string().uuid('Invalid organization ID'),
  state_code: z.enum(['GA', 'IN', 'FL']),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^\+?1?\s*\(?-*\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4}$/, 'Please enter a valid US phone number (e.g. 555-123-4567)'),
  inquiry_type: z.enum(['caregiver_inquiry', 'client_care_inquiry', 'general_question'], {
    required_error: 'Please select an inquiry type',
  }),
  message: z.string().min(10, 'Message must contain at least 10 characters').max(2000, 'Message cannot exceed 2000 characters'),
  source_url: z.string().url('Invalid source URL'),
  honeypot: z.string().max(0, 'Spam detected').optional(),
});

export type CreatePublicInquiryInput = z.infer<typeof CreatePublicInquirySchema>;

// ============================================================
// Caregiver Application Schemas (Feature Spec 02)
// ============================================================

// Step 1: Personal Information
export const CaregiverAddressSchema = z.object({
  street: z.string().min(3, 'Street address is required'),
  unit: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().length(2, 'State code must be 2 letters'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Valid ZIP code required'),
});

export const PersonalInfoStepSchema = z.object({
  first_name: z.string().min(2, 'First name is required').max(50),
  middle_name: z.string().max(50).optional(),
  last_name: z.string().min(2, 'Last name is required').max(50),
  email: z.string().email('Valid email is required'),
  phone: z.string().regex(
    /^\+?1?\s*\(?-*\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4}$/,
    'Valid US phone number required'
  ),
  dob: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be YYYY-MM-DD')
    .refine((date) => {
      const age = (new Date().getTime() - new Date(date).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      return age >= 18;
    }, 'Applicant must be at least 18 years old'),
  ssn: z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/, 'Valid 9-digit SSN required'),
  address: CaregiverAddressSchema,
});

export type PersonalInfoStepInput = z.infer<typeof PersonalInfoStepSchema>;

// Step 2: Availability & Positions
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
      .min(1, 'Select at least one shift'),
    max_weekly_hours: z.number().min(1).max(60),
    willing_to_travel_miles: z.number().min(5).max(100),
  }),
});

export type AvailabilityStepInput = z.infer<typeof AvailabilityStepSchema>;

// Step 3: Experience & References
export const WorkExperienceItemSchema = z.object({
  employer_name: z.string().min(2, 'Employer name is required'),
  job_title: z.string().min(2, 'Job title is required'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD').optional(),
  reason_for_leaving: z.string().optional(),
  supervisor_contact: z.string().optional(),
});

export const ReferenceItemSchema = z.object({
  name: z.string().min(2, 'Reference name is required'),
  relationship: z.enum(['professional', 'personal', 'supervisor']),
  phone: z.string().regex(
    /^\+?1?\s*\(?-*\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4}$/,
    'Valid phone required'
  ),
  email: z.string().email().optional().or(z.literal('')),
  years_known: z.number().min(1, 'Years known must be at least 1'),
});

export const ExperienceStepSchema = z.object({
  experience_history: z
    .array(WorkExperienceItemSchema)
    .min(1, 'Please provide at least one work experience'),
  references: z
    .array(ReferenceItemSchema)
    .min(2, 'At least 2 references are required'),
});

export type ExperienceStepInput = z.infer<typeof ExperienceStepSchema>;

// Step 4: Professional Licenses
export const ProfessionalLicenseItemSchema = z.object({
  license_type: z.enum(['CNA', 'HHA', 'LPN', 'RN', 'CPR', 'PCA']),
  license_number: z.string().min(3, 'License number is required'),
  issuing_state: z.string().length(2, 'Issuing state must be 2 letters'),
  expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiration date must be YYYY-MM-DD'),
});

export const LicensesStepSchema = z.object({
  professional_licenses: z.array(ProfessionalLicenseItemSchema).optional().default([]),
});

export type LicensesStepInput = z.infer<typeof LicensesStepSchema>;

// Step 5: Legal Disclosures & Attestation
export const LegalDisclosuresStepSchema = z.object({
  authorized_to_work_in_us: z.literal(true, {
    errorMap: () => ({ message: 'You must be legally authorized to work in the United States' }),
  }),
  felony_conviction: z.boolean(),
  felony_explanation: z.string().optional(),
  drug_screen_consent: z.literal(true, {
    errorMap: () => ({ message: 'Consent to drug screening is required' }),
  }),
  background_check_consent: z.literal(true, {
    errorMap: () => ({ message: 'Consent to background screening is required' }),
  }),
  attestation_signature: z.string().min(3, 'Type your full legal name as digital signature'),
  attestation_timestamp: z.string().datetime(),
  signature_base64: z.string().optional(),
});

export type LegalDisclosuresStepInput = z.infer<typeof LegalDisclosuresStepSchema>;

// Master Application Schema
export const CompleteCaregiverApplicationSchema = z.object({
  org_id: z.string().uuid(),
  state_code: z.enum(['GA', 'IN', 'FL']),
  personal_info: PersonalInfoStepSchema,
  positions_applied: AvailabilityStepSchema.shape.positions_applied,
  availability: AvailabilityStepSchema.shape.availability,
  experience_history: ExperienceStepSchema.shape.experience_history,
  references: ExperienceStepSchema.shape.references,
  professional_licenses: LicensesStepSchema.shape.professional_licenses,
  legal_disclosures: LegalDisclosuresStepSchema,
});

export type CompleteCaregiverApplicationInput = z.infer<typeof CompleteCaregiverApplicationSchema>;

// Draft Save Schema (partial per-step)
export const SaveCaregiverDraftSchema = z.object({
  step: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  org_id: z.string().uuid(),
  state_code: z.enum(['GA', 'IN', 'FL']),
  data: z.record(z.unknown()),
});

export type SaveCaregiverDraftInput = z.infer<typeof SaveCaregiverDraftSchema>;

// ============================================================
// E-Signature Schemas (Feature Spec 09)
// ============================================================

export const CreateEnvelopeRequestSchema = z.object({
  org_id: z.string().uuid(),
  template_type: z.enum(['caregiver_onboarding_packet', 'client_service_agreement']),
  signer_name: z.string().min(2, 'Signer name required'),
  signer_email: z.string().email('Valid email required'),
  signer_user_id: z.string().uuid().optional(),
  merge_data: z.record(z.unknown()).default({}),
});

export type CreateEnvelopeRequestInput = z.infer<typeof CreateEnvelopeRequestSchema>;

export const CompleteSignatureSchema = z.object({
  envelope_id: z.string(),
  signature_base64: z.string().min(10, 'Valid signature required'),
  agreed_to_terms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the electronic signature disclosures' }),
  }),
});

export type CompleteSignatureInput = z.infer<typeof CompleteSignatureSchema>;

// ============================================================
// Caregiver Documents & Credential Schemas (Feature Spec 03)
// ============================================================

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

export const DocumentUploadSchema = z.object({
  caregiver_id: z.string().min(1, 'Caregiver ID is required'),
  category: DocumentCategorySchema,
  file_name: z.string().min(1, 'File name is required'),
  file_size_bytes: z.number().max(25 * 1024 * 1024, 'File size cannot exceed 25MB'),
  mime_type: z.enum([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/heic',
    'image/webp',
  ]),
  file_base64: z.string().optional(),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Issue date must be YYYY-MM-DD').optional().or(z.literal('')),
  expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiration date must be YYYY-MM-DD').optional().or(z.literal('')),
  has_no_expiration: z.boolean().default(false),
});

export type DocumentUploadInput = z.infer<typeof DocumentUploadSchema>;

export const DocumentReviewSchema = z.object({
  document_id: z.string().min(1, 'Document ID is required'),
  decision: z.enum(['approved', 'rejected']),
  rejection_reason: z.string().min(5, 'Rejection reason must be at least 5 characters when rejecting').optional(),
  corrected_expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional().or(z.literal('')),
}).refine(
  (data) => {
    if (data.decision === 'rejected' && (!data.rejection_reason || data.rejection_reason.trim().length < 5)) {
      return false;
    }
    return true;
  },
  {
    message: 'Rejection reason is required when rejecting a document',
    path: ['rejection_reason'],
  }
);

export type DocumentReviewInput = z.infer<typeof DocumentReviewSchema>;


