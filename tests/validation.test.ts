import { describe, it, expect } from 'vitest';
import { CreatePublicInquirySchema, OrganizationSchema } from '../packages/validation/src/index';

describe('Crystal Validation Schemas & Data Models', () => {
  describe('CreatePublicInquirySchema', () => {
    it('validates a valid Georgia caregiver inquiry', () => {
      const validPayload = {
        org_id: '00000000-0000-0000-0000-000000000001',
        state_code: 'GA',
        full_name: 'Sarah Connor',
        email: 'sarah.c@example.com',
        phone: '(404) 555-0122',
        inquiry_type: 'caregiver_inquiry',
        message: 'I am a certified CNA applying for attendant positions in Atlanta.',
        source_url: 'https://withopenhands.com/contact',
      };

      const result = CreatePublicInquirySchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('validates a valid Indiana client care inquiry', () => {
      const validPayload = {
        org_id: '00000000-0000-0000-0000-000000000002',
        state_code: 'IN',
        full_name: 'Arthur Pendelton',
        email: 'arthur.p@example.com',
        phone: '317-555-9876',
        inquiry_type: 'client_care_inquiry',
        message: 'Looking for 30 hours per week of personal care support in Indianapolis.',
        source_url: 'https://cherishopenarms.com/contact',
      };

      const result = CreatePublicInquirySchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email formats', () => {
      const invalidPayload = {
        org_id: '00000000-0000-0000-0000-000000000001',
        state_code: 'GA',
        full_name: 'Invalid Email User',
        email: 'not-an-email',
        phone: '(404) 555-0122',
        inquiry_type: 'general_question',
        message: 'This is a test message to test email validation.',
        source_url: 'https://withopenhands.com/contact',
      };

      const result = CreatePublicInquirySchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toBeDefined();
      }
    });

    it('rejects messages that are too short (< 10 chars)', () => {
      const invalidPayload = {
        org_id: '00000000-0000-0000-0000-000000000001',
        state_code: 'GA',
        full_name: 'Short Message User',
        email: 'test@example.com',
        phone: '(404) 555-0122',
        inquiry_type: 'general_question',
        message: 'Hi',
        source_url: 'https://withopenhands.com/contact',
      };

      const result = CreatePublicInquirySchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.message).toBeDefined();
      }
    });

    it('catches honeypot spam', () => {
      const spamPayload = {
        org_id: '00000000-0000-0000-0000-000000000001',
        state_code: 'GA',
        full_name: 'Bot User',
        email: 'bot@spam.com',
        phone: '(404) 555-0122',
        inquiry_type: 'general_question',
        message: 'Check out this spam link on the internet today!',
        source_url: 'https://withopenhands.com/contact',
        honeypot: 'http://spam-link.com',
      };

      const result = CreatePublicInquirySchema.safeParse(spamPayload);
      expect(result.success).toBe(false);
    });
  });
});
