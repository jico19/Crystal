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
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid end date required').optional(),
  reason_for_leaving: z.string().optional(),
  supervisor_contact: z.string().optional(),
});

export const ReferenceItemSchema = z.object({
  name: z.string().min(2, 'Reference name is required'),
  relationship: z.enum(['professional', 'personal', 'supervisor']),
  phone: z.string().regex(/^\+?1?\s*\(?-*\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4}$/, 'Valid US phone number required'),
  email: z.string().email().optional(),
  years_known: z.number().min(0.5, 'Years known must be at least 0.5'),
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
