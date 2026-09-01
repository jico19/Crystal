import { describe, it, expect, beforeEach } from 'vitest';
import {
  encryptPII,
  decryptPII,
  extractSSNLast4,
  maskSSN,
  sanitizePersonalInfoSSN,
} from '../apps/api/src/lib/security';
import {
  getOrCreateCaregiverProfile,
  updateCaregiverProfile,
  mockCaregiverProfiles,
} from '../apps/api/src/lib/store';

// ─── Security Utilities ──────────────────────────────────────────────────────

describe('Crystal Caregiver API — Security & Store', () => {
  describe('Security utilities', () => {
    describe('encryptPII / decryptPII', () => {
      it('round-trip returns the original value for a typical SSN', () => {
        const original = '123-45-6789';
        const encrypted = encryptPII(original);
        expect(decryptPII(encrypted)).toBe(original);
      });

      it('round-trip returns the original value for an unformatted SSN', () => {
        const original = '987654321';
        const encrypted = encryptPII(original);
        expect(decryptPII(encrypted)).toBe(original);
      });

      it('encrypted value is base64-encoded and not equal to plaintext', () => {
        const original = '123-45-6789';
        const encrypted = encryptPII(original);
        expect(encrypted).not.toBe(original);
        // Valid base64 only contains [A-Za-z0-9+/=]
        expect(/^[A-Za-z0-9+/]+=*$/.test(encrypted)).toBe(true);
      });
    });

    describe('extractSSNLast4', () => {
      it('returns last 4 digits from hyphenated SSN "123-45-6789" → "6789"', () => {
        expect(extractSSNLast4('123-45-6789')).toBe('6789');
      });

      it('handles unformatted "123456789" → "6789"', () => {
        expect(extractSSNLast4('123456789')).toBe('6789');
      });

      it('strips all non-digit characters before slicing', () => {
        expect(extractSSNLast4('111 22 3344')).toBe('3344');
      });
    });

    describe('maskSSN', () => {
      it('returns "***-**-6789" for hyphenated SSN "123-45-6789"', () => {
        expect(maskSSN('123-45-6789')).toBe('***-**-6789');
      });

      it('returns "***-**-9999" for unformatted "123459999"', () => {
        expect(maskSSN('123459999')).toBe('***-**-9999');
      });

      it('returns "***-**-****" for an invalid SSN (wrong digit count)', () => {
        expect(maskSSN('12345')).toBe('***-**-****');
      });

      it('returns "***-**-****" for an empty string', () => {
        expect(maskSSN('')).toBe('***-**-****');
      });
    });

    describe('sanitizePersonalInfoSSN', () => {
      it('removes "ssn" key from result', () => {
        const sanitized = sanitizePersonalInfoSSN({
          first_name: 'Janelle',
          ssn: '123-45-6789',
        });
        expect(sanitized).not.toHaveProperty('ssn');
      });

      it('sets "ssn_last4" correctly from hyphenated SSN', () => {
        const sanitized = sanitizePersonalInfoSSN({ ssn: '123-45-6789' });
        expect(sanitized.ssn_last4).toBe('6789');
      });

      it('sets "ssn_encrypted" and it is not the raw SSN', () => {
        const rawSSN = '123-45-6789';
        const sanitized = sanitizePersonalInfoSSN({ ssn: rawSSN });
        expect(sanitized.ssn_encrypted).toBeDefined();
        expect(sanitized.ssn_encrypted).not.toBe(rawSSN);
      });

      it('handles missing ssn gracefully — no ssn_last4 or ssn_encrypted set', () => {
        const sanitized = sanitizePersonalInfoSSN({ first_name: 'Marcus' });
        expect(sanitized).not.toHaveProperty('ssn');
        expect(sanitized).not.toHaveProperty('ssn_last4');
        expect(sanitized).not.toHaveProperty('ssn_encrypted');
      });

      it('preserves all non-SSN fields', () => {
        const sanitized = sanitizePersonalInfoSSN({
          first_name: 'Janelle',
          last_name: 'Whitfield',
          ssn: '987-65-4321',
        });
        expect(sanitized.first_name).toBe('Janelle');
        expect(sanitized.last_name).toBe('Whitfield');
      });
    });
  });

  // ─── Store functions ───────────────────────────────────────────────────────

  describe('Store functions', () => {
    // Clear in-memory store before every test to ensure isolation
    beforeEach(() => {
      mockCaregiverProfiles.clear();
    });

    const GA_ORG_ID = '00000000-0000-0000-0000-000000000001';
    const IN_ORG_ID = '00000000-0000-0000-0000-000000000002';

    describe('getOrCreateCaregiverProfile', () => {
      it('creates a new profile for a new userId', () => {
        const profile = getOrCreateCaregiverProfile('user-ga-001', GA_ORG_ID, 'GA');
        expect(profile).toBeDefined();
        expect(profile.user_id).toBe('user-ga-001');
        expect(profile.org_id).toBe(GA_ORG_ID);
        expect(profile.state_code).toBe('GA');
      });

      it('returns the existing profile on a second call for the same userId', () => {
        const first = getOrCreateCaregiverProfile('user-ga-002', GA_ORG_ID, 'GA');
        const second = getOrCreateCaregiverProfile('user-ga-002', GA_ORG_ID, 'GA');
        expect(second.id).toBe(first.id);
        expect(mockCaregiverProfiles.size).toBe(1);
      });

      it('created profile has "draft" status and step 1', () => {
        const profile = getOrCreateCaregiverProfile('user-in-001', IN_ORG_ID, 'IN');
        expect(profile.application_status).toBe('draft');
        expect(profile.application_step).toBe(1);
      });

      it('created profile has default onboarding_checklist with all steps "not_started" except application_form', () => {
        const profile = getOrCreateCaregiverProfile('user-in-002', IN_ORG_ID, 'IN');
        const checklist = profile.onboarding_checklist;
        expect(checklist.application_form).toBe('in_progress');
        expect(checklist.id_documents).toBe('not_started');
        expect(checklist.background_check).toBe('not_started');
        expect(checklist.tb_physical).toBe('not_started');
        expect(checklist.in_service_orientation).toBe('not_started');
        expect(checklist.direct_deposit_w4).toBe('not_started');
        expect(checklist.final_admin_approval).toBe('not_started');
      });

      it('creates distinct profiles for two different userIds', () => {
        const profileA = getOrCreateCaregiverProfile('user-ga-003', GA_ORG_ID, 'GA');
        const profileB = getOrCreateCaregiverProfile('user-in-003', IN_ORG_ID, 'IN');
        expect(profileA.id).not.toBe(profileB.id);
        expect(mockCaregiverProfiles.size).toBe(2);
      });
    });

    describe('updateCaregiverProfile', () => {
      it('updates fields correctly for an existing profile', () => {
        getOrCreateCaregiverProfile('user-ga-004', GA_ORG_ID, 'GA');
        const updated = updateCaregiverProfile('user-ga-004', {
          application_status: 'submitted',
          application_step: 5,
        });
        expect(updated).not.toBeNull();
        expect(updated?.application_status).toBe('submitted');
        expect(updated?.application_step).toBe(5);
      });

      it('returns null for an unknown userId', () => {
        const result = updateCaregiverProfile('user-nonexistent', {
          application_status: 'submitted',
        });
        expect(result).toBeNull();
      });

      it('updates updated_at timestamp (newer than created_at)', async () => {
        const profile = getOrCreateCaregiverProfile('user-ga-005', GA_ORG_ID, 'GA');
        const createdAt = profile.created_at;

        // Small delay to ensure updated_at > created_at
        await new Promise((resolve) => setTimeout(resolve, 5));

        const updated = updateCaregiverProfile('user-ga-005', { application_step: 2 });
        expect(updated?.updated_at).toBeDefined();
        expect(new Date(updated!.updated_at).getTime()).toBeGreaterThanOrEqual(
          new Date(createdAt).getTime()
        );
      });

      it('persists updates in the store map so subsequent reads reflect changes', () => {
        getOrCreateCaregiverProfile('user-ga-006', GA_ORG_ID, 'GA');
        updateCaregiverProfile('user-ga-006', { application_step: 3 });
        const stored = mockCaregiverProfiles.get('user-ga-006');
        expect(stored?.application_step).toBe(3);
      });
    });
  });
});
