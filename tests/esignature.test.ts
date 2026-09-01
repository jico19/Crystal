import { describe, it, expect, beforeEach } from 'vitest';
import {
  CreateEnvelopeRequestSchema,
  CompleteSignatureSchema,
} from '../packages/validation/src/index';
import { computeDocumentHash } from '../apps/api/src/lib/security';
import {
  mockSignatureEnvelopes,
  createSignatureEnvelope,
  getSignatureEnvelope,
  completeSignatureEnvelope,
} from '../apps/api/src/lib/store';

const VALID_ORG_ID = '00000000-0000-0000-0000-000000000001';
const VALID_USER_ID = '00000000-0000-0000-0000-000000000002';
const SAMPLE_BASE64_SIG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('Feature Spec 09: E-Signature & Agreement System', () => {
  beforeEach(() => {
    mockSignatureEnvelopes.clear();
  });

  // ─── 1. Schema Validation: CreateEnvelopeRequestSchema ───────────────────────

  describe('CreateEnvelopeRequestSchema', () => {
    it('accepts a valid caregiver_onboarding_packet envelope request', () => {
      const result = CreateEnvelopeRequestSchema.safeParse({
        org_id: VALID_ORG_ID,
        template_type: 'caregiver_onboarding_packet',
        signer_name: 'Janelle Whitfield',
        signer_email: 'janelle.w@example.com',
        signer_user_id: VALID_USER_ID,
        merge_data: { role: 'CNA', rate: 22.5 },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.signer_name).toBe('Janelle Whitfield');
        expect(result.data.template_type).toBe('caregiver_onboarding_packet');
        expect(result.data.merge_data).toEqual({ role: 'CNA', rate: 22.5 });
      }
    });

    it('accepts a valid client_service_agreement envelope request', () => {
      const result = CreateEnvelopeRequestSchema.safeParse({
        org_id: VALID_ORG_ID,
        template_type: 'client_service_agreement',
        signer_name: 'Robert Vance',
        signer_email: 'robert.vance@example.com',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.template_type).toBe('client_service_agreement');
        expect(result.data.merge_data).toEqual({});
      }
    });

    it('rejects an invalid org_id (not a UUID)', () => {
      const result = CreateEnvelopeRequestSchema.safeParse({
        org_id: 'invalid-org-id',
        template_type: 'caregiver_onboarding_packet',
        signer_name: 'Janelle Whitfield',
        signer_email: 'janelle.w@example.com',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('org_id');
      }
    });

    it('rejects an unknown template_type', () => {
      const result = CreateEnvelopeRequestSchema.safeParse({
        org_id: VALID_ORG_ID,
        template_type: 'unknown_agreement_type',
        signer_name: 'Janelle Whitfield',
        signer_email: 'janelle.w@example.com',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('template_type');
      }
    });

    it('rejects a signer_name with fewer than 2 characters', () => {
      const result = CreateEnvelopeRequestSchema.safeParse({
        org_id: VALID_ORG_ID,
        template_type: 'caregiver_onboarding_packet',
        signer_name: 'J',
        signer_email: 'janelle.w@example.com',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('signer_name');
        expect(result.error.issues[0].message).toBe('Signer name required');
      }
    });

    it('rejects an invalid email format', () => {
      const result = CreateEnvelopeRequestSchema.safeParse({
        org_id: VALID_ORG_ID,
        template_type: 'caregiver_onboarding_packet',
        signer_name: 'Janelle Whitfield',
        signer_email: 'not-an-email',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('signer_email');
        expect(result.error.issues[0].message).toBe('Valid email required');
      }
    });

    it('rejects a non-UUID signer_user_id if provided', () => {
      const result = CreateEnvelopeRequestSchema.safeParse({
        org_id: VALID_ORG_ID,
        template_type: 'caregiver_onboarding_packet',
        signer_name: 'Janelle Whitfield',
        signer_email: 'janelle.w@example.com',
        signer_user_id: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('signer_user_id');
      }
    });
  });

  // ─── 2. Schema Validation: CompleteSignatureSchema ───────────────────────────

  describe('CompleteSignatureSchema', () => {
    it('accepts a valid completion payload with signature base64 and agreed_to_terms = true', () => {
      const result = CompleteSignatureSchema.safeParse({
        envelope_id: 'env-123456789',
        signature_base64: SAMPLE_BASE64_SIG,
        agreed_to_terms: true,
      });
      expect(result.success).toBe(true);
    });

    it('rejects signature_base64 shorter than 10 characters', () => {
      const result = CompleteSignatureSchema.safeParse({
        envelope_id: 'env-123456789',
        signature_base64: 'abc',
        agreed_to_terms: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('signature_base64');
        expect(result.error.issues[0].message).toBe('Valid signature required');
      }
    });

    it('rejects if agreed_to_terms is false or omitted', () => {
      const resultFalse = CompleteSignatureSchema.safeParse({
        envelope_id: 'env-123456789',
        signature_base64: SAMPLE_BASE64_SIG,
        agreed_to_terms: false,
      });
      expect(resultFalse.success).toBe(false);
      if (!resultFalse.success) {
        expect(resultFalse.error.issues[0].path).toContain('agreed_to_terms');
        expect(resultFalse.error.issues[0].message).toBe(
          'You must agree to the electronic signature disclosures'
        );
      }

      const resultMissing = CompleteSignatureSchema.safeParse({
        envelope_id: 'env-123456789',
        signature_base64: SAMPLE_BASE64_SIG,
      });
      expect(resultMissing.success).toBe(false);
    });

    it('rejects missing envelope_id', () => {
      const result = CompleteSignatureSchema.safeParse({
        signature_base64: SAMPLE_BASE64_SIG,
        agreed_to_terms: true,
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── 3. Cryptographic SHA-256 Tamper-Evident Hash ────────────────────────────

  describe('Cryptographic SHA-256 Document Hash', () => {
    const canonicalInput = {
      envelope_id: 'env-test-001',
      org_id: VALID_ORG_ID,
      signer_name: 'Janelle Whitfield',
      signer_email: 'janelle@example.com',
      signed_at: '2026-09-01T12:00:00.000Z',
      signature_base64: SAMPLE_BASE64_SIG,
    };

    it('generates a 64-character hex SHA-256 hash', () => {
      const hash = computeDocumentHash(canonicalInput);
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });

    it('is deterministic: identical inputs generate the exact same hash', () => {
      const hash1 = computeDocumentHash(canonicalInput);
      const hash2 = computeDocumentHash({ ...canonicalInput });
      expect(hash1).toBe(hash2);
    });

    it('is tamper-evident: changing signer name changes hash', () => {
      const originalHash = computeDocumentHash(canonicalInput);
      const modifiedHash = computeDocumentHash({
        ...canonicalInput,
        signer_name: 'Janelle X. Whitfield',
      });
      expect(modifiedHash).not.toBe(originalHash);
    });

    it('is tamper-evident: changing timestamp changes hash', () => {
      const originalHash = computeDocumentHash(canonicalInput);
      const modifiedHash = computeDocumentHash({
        ...canonicalInput,
        signed_at: '2026-09-01T12:00:01.000Z',
      });
      expect(modifiedHash).not.toBe(originalHash);
    });

    it('is tamper-evident: changing signature base64 changes hash', () => {
      const originalHash = computeDocumentHash(canonicalInput);
      const modifiedHash = computeDocumentHash({
        ...canonicalInput,
        signature_base64: `${SAMPLE_BASE64_SIG}_altered`,
      });
      expect(modifiedHash).not.toBe(originalHash);
    });
  });

  // ─── 4. In-Memory Store & E-Signature Lifecycle ──────────────────────────────

  describe('E-Signature Store Lifecycle', () => {
    it('creates an envelope with initial status "sent", role "caregiver", and 30-day expiry', () => {
      const envelope = createSignatureEnvelope({
        org_id: VALID_ORG_ID,
        template_type: 'caregiver_onboarding_packet',
        signer_name: 'Janelle Whitfield',
        signer_email: 'janelle.w@example.com',
        signer_user_id: VALID_USER_ID,
      });

      expect(envelope.id).toMatch(/^env-\d+-[a-z0-9]+$/);
      expect(envelope.status).toBe('sent');
      expect(envelope.signer_role).toBe('caregiver');
      expect(envelope.title).toBe('Caregiver Onboarding & Attestation Packet');
      expect(envelope.signer_name).toBe('Janelle Whitfield');
      expect(envelope.signer_email).toBe('janelle.w@example.com');
      expect(envelope.signature_base64).toBeUndefined();
      expect(envelope.signed_document_hash).toBeUndefined();

      // Check expiry is in future (~30 days)
      const now = new Date().getTime();
      const expiry = new Date(envelope.expires_at).getTime();
      const diffDays = Math.round((expiry - now) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(30);

      // Verify retrieval from store
      const retrieved = getSignatureEnvelope(envelope.id);
      expect(retrieved).toEqual(envelope);
    });

    it('creates client_service_agreement with default role "client_rep"', () => {
      const envelope = createSignatureEnvelope({
        org_id: VALID_ORG_ID,
        template_type: 'client_service_agreement',
        signer_name: 'Robert Vance',
        signer_email: 'robert@example.com',
      });

      expect(envelope.signer_role).toBe('client_rep');
      expect(envelope.title).toBe('Client Home Care Services Agreement');
    });

    it('completes an envelope signature and stamps it with SHA-256 hash and audit metadata', () => {
      const envelope = createSignatureEnvelope({
        org_id: VALID_ORG_ID,
        template_type: 'caregiver_onboarding_packet',
        signer_name: 'Janelle Whitfield',
        signer_email: 'janelle.w@example.com',
      });

      const completed = completeSignatureEnvelope(
        envelope.id,
        SAMPLE_BASE64_SIG,
        '192.168.1.100',
        'Mozilla/5.0 TestBrowser'
      );

      expect(completed).not.toBeNull();
      expect(completed!.status).toBe('completed');
      expect(completed!.signature_base64).toBe(SAMPLE_BASE64_SIG);
      expect(completed!.signed_at).toBeDefined();
      expect(completed!.ip_address).toBe('192.168.1.100');
      expect(completed!.user_agent).toBe('Mozilla/5.0 TestBrowser');
      expect(completed!.signed_document_hash).toHaveLength(64);

      // Verify hash integrity matches computeDocumentHash
      const expectedHash = computeDocumentHash({
        envelope_id: envelope.id,
        org_id: envelope.org_id,
        signer_name: envelope.signer_name,
        signer_email: envelope.signer_email,
        signed_at: completed!.signed_at!,
        signature_base64: SAMPLE_BASE64_SIG,
      });
      expect(completed!.signed_document_hash).toBe(expectedHash);

      // Verify updated state in store
      const inStore = getSignatureEnvelope(envelope.id);
      expect(inStore?.status).toBe('completed');
      expect(inStore?.signed_document_hash).toBe(expectedHash);
    });

    it('returns null when completing a nonexistent envelope', () => {
      const completed = completeSignatureEnvelope(
        'env-nonexistent-999',
        SAMPLE_BASE64_SIG
      );
      expect(completed).toBeNull();
    });
  });
});
