import { describe, it, expect } from 'vitest';
import {
  PersonalInfoStepSchema,
  AvailabilityStepSchema,
  ExperienceStepSchema,
  LicensesStepSchema,
  LegalDisclosuresStepSchema,
  CompleteCaregiverApplicationSchema,
  SaveCaregiverDraftSchema,
} from '../packages/validation/src/index';

// ─── Shared test fixtures ────────────────────────────────────────────────────

/** Returns a YYYY-MM-DD date string offset by `years` from today */
function dobYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().split('T')[0];
}

/** Today minus exactly 17 years (under-age) */
const DOB_UNDER_18 = dobYearsAgo(17);

/** Today minus exactly 18 years (just legal) */
const DOB_EXACTLY_18 = dobYearsAgo(18);

/** Reusable valid personal-info payload (Georgia applicant) */
const VALID_PERSONAL_INFO = {
  first_name: 'Janelle',
  last_name: 'Whitfield',
  email: 'janelle.whitfield@example.com',
  phone: '(404) 555-0183',
  dob: dobYearsAgo(30),
  ssn: '123-45-6789',
  address: {
    street: '742 Peachtree St NW',
    city: 'Atlanta',
    state: 'GA',
    zip: '30308',
  },
};

/** Reusable valid availability payload */
const VALID_AVAILABILITY = {
  positions_applied: ['cna', 'hha'] as const,
  availability: {
    full_time: false,
    part_time: true,
    prn: false,
    days_available: ['mon', 'wed', 'fri'] as const,
    shifts_available: ['mornings', 'afternoons'] as const,
    max_weekly_hours: 32,
    willing_to_travel_miles: 20,
  },
};

/** Two valid references */
const VALID_REFERENCES = [
  {
    name: 'Donna Beaumont',
    relationship: 'supervisor' as const,
    phone: '(404) 555-7711',
    email: 'donna.b@atlantahomecare.com',
    years_known: 4,
  },
  {
    name: 'Raymond Torres',
    relationship: 'professional' as const,
    phone: '(317) 555-3344',
    years_known: 2,
  },
];

/** One valid work experience entry */
const VALID_EXPERIENCE_HISTORY = [
  {
    employer_name: 'Atlanta Home Health Services',
    job_title: 'Certified Nursing Assistant',
    start_date: '2020-03-01',
    end_date: '2023-08-15',
    reason_for_leaving: 'Relocated to Indianapolis area',
    supervisor_contact: 'mgr@atlantahh.com',
  },
];

/** One valid professional license */
const VALID_LICENSE = {
  license_type: 'CNA' as const,
  license_number: 'GA-CNA-20184',
  issuing_state: 'GA',
  expiration_date: '2027-06-30',
};

/** Valid legal disclosures payload */
const VALID_LEGAL_DISCLOSURES = {
  authorized_to_work_in_us: true as const,
  felony_conviction: false,
  drug_screen_consent: true as const,
  background_check_consent: true as const,
  attestation_signature: 'Janelle Whitfield',
  attestation_timestamp: new Date().toISOString(),
};

// ─── PersonalInfoStepSchema ──────────────────────────────────────────────────

describe('Crystal Caregiver Validation Schemas', () => {
  describe('PersonalInfoStepSchema', () => {
    it('valid complete personal info passes', () => {
      const result = PersonalInfoStepSchema.safeParse(VALID_PERSONAL_INFO);
      expect(result.success).toBe(true);
    });

    it('under-18 applicant (DOB = today minus 17 years) fails with age error', () => {
      const result = PersonalInfoStepSchema.safeParse({
        ...VALID_PERSONAL_INFO,
        dob: DOB_UNDER_18,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        expect(messages).toContain('Applicant must be at least 18 years old');
      }
    });

    it('exactly 18 years old passes age validation', () => {
      const result = PersonalInfoStepSchema.safeParse({
        ...VALID_PERSONAL_INFO,
        dob: DOB_EXACTLY_18,
      });
      expect(result.success).toBe(true);
    });

    it('invalid email format fails', () => {
      const result = PersonalInfoStepSchema.safeParse({
        ...VALID_PERSONAL_INFO,
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toBeDefined();
      }
    });

    it('invalid US phone format fails', () => {
      const result = PersonalInfoStepSchema.safeParse({
        ...VALID_PERSONAL_INFO,
        phone: '12345',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.phone).toBeDefined();
      }
    });

    it('SSN too short fails', () => {
      const result = PersonalInfoStepSchema.safeParse({
        ...VALID_PERSONAL_INFO,
        ssn: '123-45',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.ssn).toBeDefined();
      }
    });

    it('SSN with letters fails', () => {
      const result = PersonalInfoStepSchema.safeParse({
        ...VALID_PERSONAL_INFO,
        ssn: 'abc-de-fghi',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.ssn).toBeDefined();
      }
    });

    it('valid unformatted SSN "123456789" passes', () => {
      const result = PersonalInfoStepSchema.safeParse({
        ...VALID_PERSONAL_INFO,
        ssn: '123456789',
      });
      expect(result.success).toBe(true);
    });

    it('valid hyphenated SSN "123-45-6789" passes', () => {
      const result = PersonalInfoStepSchema.safeParse({
        ...VALID_PERSONAL_INFO,
        ssn: '123-45-6789',
      });
      expect(result.success).toBe(true);
    });

    it('missing required first_name fails', () => {
      const { first_name: _omit, ...rest } = VALID_PERSONAL_INFO;
      const result = PersonalInfoStepSchema.safeParse(rest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.first_name).toBeDefined();
      }
    });

    it('missing address city fails', () => {
      const result = PersonalInfoStepSchema.safeParse({
        ...VALID_PERSONAL_INFO,
        address: { ...VALID_PERSONAL_INFO.address, city: '' },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });

    it('invalid ZIP code fails', () => {
      const result = PersonalInfoStepSchema.safeParse({
        ...VALID_PERSONAL_INFO,
        address: { ...VALID_PERSONAL_INFO.address, zip: 'ABCDE' },
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── AvailabilityStepSchema ────────────────────────────────────────────────

  describe('AvailabilityStepSchema', () => {
    it('valid availability with positions and shifts passes', () => {
      const result = AvailabilityStepSchema.safeParse(VALID_AVAILABILITY);
      expect(result.success).toBe(true);
    });

    it('empty positions_applied array fails with "Select at least one position"', () => {
      const result = AvailabilityStepSchema.safeParse({
        ...VALID_AVAILABILITY,
        positions_applied: [],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        expect(messages).toContain('Select at least one position');
      }
    });

    it('empty days_available fails with "Select at least one available day"', () => {
      const result = AvailabilityStepSchema.safeParse({
        ...VALID_AVAILABILITY,
        availability: { ...VALID_AVAILABILITY.availability, days_available: [] },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        expect(messages).toContain('Select at least one available day');
      }
    });

    it('max_weekly_hours exceeding 60 fails', () => {
      const result = AvailabilityStepSchema.safeParse({
        ...VALID_AVAILABILITY,
        availability: { ...VALID_AVAILABILITY.availability, max_weekly_hours: 61 },
      });
      expect(result.success).toBe(false);
    });

    it('willing_to_travel_miles below 5 fails', () => {
      const result = AvailabilityStepSchema.safeParse({
        ...VALID_AVAILABILITY,
        availability: { ...VALID_AVAILABILITY.availability, willing_to_travel_miles: 3 },
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── ExperienceStepSchema ──────────────────────────────────────────────────

  describe('ExperienceStepSchema', () => {
    it('valid experience with 2 references passes', () => {
      const result = ExperienceStepSchema.safeParse({
        experience_history: VALID_EXPERIENCE_HISTORY,
        references: VALID_REFERENCES,
      });
      expect(result.success).toBe(true);
    });

    it('only 1 reference fails with "At least 2 references are required"', () => {
      const result = ExperienceStepSchema.safeParse({
        experience_history: VALID_EXPERIENCE_HISTORY,
        references: [VALID_REFERENCES[0]],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        expect(messages).toContain('At least 2 references are required');
      }
    });

    it('empty experience_history fails with required message', () => {
      const result = ExperienceStepSchema.safeParse({
        experience_history: [],
        references: VALID_REFERENCES,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        expect(messages).toContain('Please provide at least one work experience');
      }
    });

    it('invalid reference relationship enum fails', () => {
      const result = ExperienceStepSchema.safeParse({
        experience_history: VALID_EXPERIENCE_HISTORY,
        references: [
          { ...VALID_REFERENCES[0], relationship: 'neighbor' },
          VALID_REFERENCES[1],
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── LicensesStepSchema ────────────────────────────────────────────────────

  describe('LicensesStepSchema', () => {
    it('empty professional_licenses (optional) defaults to []', () => {
      const result = LicensesStepSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.professional_licenses).toEqual([]);
      }
    });

    it('valid license entry passes', () => {
      const result = LicensesStepSchema.safeParse({
        professional_licenses: [VALID_LICENSE],
      });
      expect(result.success).toBe(true);
    });

    it('invalid license_type enum fails', () => {
      const result = LicensesStepSchema.safeParse({
        professional_licenses: [{ ...VALID_LICENSE, license_type: 'MD' }],
      });
      expect(result.success).toBe(false);
    });

    it('invalid expiration_date format fails with YYYY-MM-DD message', () => {
      const result = LicensesStepSchema.safeParse({
        professional_licenses: [{ ...VALID_LICENSE, expiration_date: '06/30/2027' }],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        expect(messages).toContain('Expiration date must be YYYY-MM-DD');
      }
    });
  });

  // ─── LegalDisclosuresStepSchema ────────────────────────────────────────────

  describe('LegalDisclosuresStepSchema', () => {
    it('valid complete legal disclosures passes', () => {
      const result = LegalDisclosuresStepSchema.safeParse(VALID_LEGAL_DISCLOSURES);
      expect(result.success).toBe(true);
    });

    it('authorized_to_work_in_us = false fails with work authorization message', () => {
      const result = LegalDisclosuresStepSchema.safeParse({
        ...VALID_LEGAL_DISCLOSURES,
        authorized_to_work_in_us: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        expect(messages).toContain(
          'You must be legally authorized to work in the United States'
        );
      }
    });

    it('drug_screen_consent = false fails', () => {
      const result = LegalDisclosuresStepSchema.safeParse({
        ...VALID_LEGAL_DISCLOSURES,
        drug_screen_consent: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        expect(messages).toContain('Consent to drug screening is required');
      }
    });

    it('background_check_consent = false fails', () => {
      const result = LegalDisclosuresStepSchema.safeParse({
        ...VALID_LEGAL_DISCLOSURES,
        background_check_consent: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        expect(messages).toContain('Consent to background screening is required');
      }
    });

    it('attestation_signature shorter than 3 chars fails', () => {
      const result = LegalDisclosuresStepSchema.safeParse({
        ...VALID_LEGAL_DISCLOSURES,
        attestation_signature: 'JW',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.attestation_signature).toBeDefined();
      }
    });

    it('invalid attestation_timestamp (non-ISO) fails', () => {
      const result = LegalDisclosuresStepSchema.safeParse({
        ...VALID_LEGAL_DISCLOSURES,
        attestation_timestamp: '09/01/2026 10:30 AM',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.attestation_timestamp).toBeDefined();
      }
    });
  });

  // ─── CompleteCaregiverApplicationSchema ───────────────────────────────────

  describe('CompleteCaregiverApplicationSchema', () => {
    const VALID_FULL_APP = {
      org_id: '00000000-0000-0000-0000-000000000001',
      state_code: 'GA' as const,
      personal_info: VALID_PERSONAL_INFO,
      positions_applied: VALID_AVAILABILITY.positions_applied,
      availability: VALID_AVAILABILITY.availability,
      experience_history: VALID_EXPERIENCE_HISTORY,
      references: VALID_REFERENCES,
      professional_licenses: [VALID_LICENSE],
      legal_disclosures: VALID_LEGAL_DISCLOSURES,
    };

    it('full valid application passes', () => {
      const result = CompleteCaregiverApplicationSchema.safeParse(VALID_FULL_APP);
      expect(result.success).toBe(true);
    });

    it('missing org_id fails', () => {
      const { org_id: _omit, ...rest } = VALID_FULL_APP;
      const result = CompleteCaregiverApplicationSchema.safeParse(rest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.org_id).toBeDefined();
      }
    });

    it('invalid state_code fails', () => {
      const result = CompleteCaregiverApplicationSchema.safeParse({
        ...VALID_FULL_APP,
        state_code: 'TX',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.state_code).toBeDefined();
      }
    });
  });

  // ─── SaveCaregiverDraftSchema ──────────────────────────────────────────────

  describe('SaveCaregiverDraftSchema', () => {
    it('valid step 1 draft save passes', () => {
      const result = SaveCaregiverDraftSchema.safeParse({
        step: 1,
        org_id: '00000000-0000-0000-0000-000000000002',
        state_code: 'IN',
        data: { first_name: 'Marcus', last_name: 'Brody' },
      });
      expect(result.success).toBe(true);
    });

    it('step = 0 fails (must be 1–5)', () => {
      const result = SaveCaregiverDraftSchema.safeParse({
        step: 0,
        org_id: '00000000-0000-0000-0000-000000000001',
        state_code: 'GA',
        data: {},
      });
      expect(result.success).toBe(false);
    });

    it('step = 6 fails (must be 1–5)', () => {
      const result = SaveCaregiverDraftSchema.safeParse({
        step: 6,
        org_id: '00000000-0000-0000-0000-000000000001',
        state_code: 'GA',
        data: {},
      });
      expect(result.success).toBe(false);
    });

    it('invalid state_code fails', () => {
      const result = SaveCaregiverDraftSchema.safeParse({
        step: 3,
        org_id: '00000000-0000-0000-0000-000000000001',
        state_code: 'TX',
        data: {},
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.state_code).toBeDefined();
      }
    });
  });
});
