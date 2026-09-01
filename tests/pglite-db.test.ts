import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import {
  getDb,
  setDb,
  resetDb,
  initDb,
  saveCaregiverDraftDb,
  getCaregiverProfileDb,
  submitCaregiverApplicationDb,
  createSignatureEnvelopeDb,
  getSignatureEnvelopeDb,
  completeSignatureEnvelopeDb,
  listSignatureEnvelopesDb,
  savePublicInquiryDb,
  listPublicInquiriesDb,
} from '../apps/api/src/lib/db';
import { computeDocumentHash } from '../apps/api/src/lib/security';
import type { LegalDisclosures } from '@crystal/types';

const GA_ORG_ID = '00000000-0000-0000-0000-000000000001';
const IN_ORG_ID = '00000000-0000-0000-0000-000000000002';
const SAMPLE_BASE64_SIG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('PGlite (WASM Embedded PostgreSQL) Local Database Layer', () => {
  beforeAll(async () => {
    process.env.PG_IN_MEMORY = 'true';
    await resetDb();
    await initDb();
  });

  beforeEach(async () => {
    const db = getDb();
    // Clean tables between tests while keeping seeded orgs and default seed inquiries
    await db.query('DELETE FROM caregiver_profiles');
    await db.query('DELETE FROM signature_envelopes');
    await db.query("DELETE FROM public_inquiries WHERE id NOT IN ('inq-001', 'inq-002', 'inq-003')");
  });

  // ─── 1. Database Initialization & Schema Verification ─────────────────────

  describe('initDb() & Schema Bootstrap', () => {
    it('creates organizations, public_inquiries, caregiver_profiles, and signature_envelopes tables', async () => {
      const db = getDb();
      const tablesQuery = await db.query<{ table_name: string }>(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);

      const tableNames = tablesQuery.rows.map((r) => r.table_name);
      expect(tableNames).toContain('organizations');
      expect(tableNames).toContain('public_inquiries');
      expect(tableNames).toContain('caregiver_profiles');
      expect(tableNames).toContain('signature_envelopes');
    });

    it('runs idempotently when called multiple times without errors', async () => {
      await expect(initDb()).resolves.toBeDefined();
      await expect(initDb(true)).resolves.toBeDefined();
    });
  });

  // ─── 2. Seed Data Verification ───────────────────────────────────────────

  describe('Organization & Public Inquiries Seed Data', () => {
    it('seeds default Georgia organization (With Open Hands)', async () => {
      const db = getDb();
      const res = await db.query<any>(
        'SELECT * FROM organizations WHERE id = $1',
        [GA_ORG_ID]
      );

      expect(res.rows).toHaveLength(1);
      const gaOrg = res.rows[0];
      expect(gaOrg.name).toBe('With Open Hands');
      expect(gaOrg.state_code).toBe('GA');
      expect(gaOrg.domain).toBe('withopenhands.com');
      expect(gaOrg.is_active).toBe(true);
    });

    it('seeds default Indiana organization (Cherish Open Arms)', async () => {
      const db = getDb();
      const res = await db.query<any>(
        'SELECT * FROM organizations WHERE id = $1',
        [IN_ORG_ID]
      );

      expect(res.rows).toHaveLength(1);
      const inOrg = res.rows[0];
      expect(inOrg.name).toBe('Cherish Open Arms');
      expect(inOrg.state_code).toBe('IN');
      expect(inOrg.domain).toBe('cherishopenarms.com');
      expect(inOrg.is_active).toBe(true);
    });

    it('seeds initial default public inquiries', async () => {
      const inquiries = await listPublicInquiriesDb();
      expect(inquiries.length).toBeGreaterThanOrEqual(3);
      const ids = inquiries.map((i) => i.id);
      expect(ids).toContain('inq-001');
      expect(ids).toContain('inq-002');
      expect(ids).toContain('inq-003');
    });
  });

  // ─── 3. Caregiver Draft Persistence & Incremental Steps ───────────────────

  describe('Caregiver Draft Persistence & SQL Verification', () => {
    const testUserId = 'test-caregiver-001';

    it('persists Step 1 personal info draft with sanitized SSN', async () => {
      const profile = await saveCaregiverDraftDb(
        testUserId,
        GA_ORG_ID,
        'GA',
        1,
        {
          first_name: 'Janelle',
          last_name: 'Whitfield',
          email: 'janelle.w@example.com',
          phone: '(404) 555-0182',
          dob: '1992-04-15',
          ssn: '123-45-6789',
          address: {
            street: '123 Peachtree Way',
            city: 'Atlanta',
            state: 'GA',
            zip: '30305',
          },
        }
      );

      expect(profile.user_id).toBe(testUserId);
      expect(profile.application_step).toBe(1);
      expect(profile.application_status).toBe('draft');
      expect(profile.personal_info.first_name).toBe('Janelle');
      expect(profile.personal_info.ssn_last4).toBe('6789');
      expect(profile.personal_info.ssn_encrypted).toBeDefined();

      // Query via raw SQL to verify PostgreSQL persistence
      const db = getDb();
      const sqlRes = await db.query<any>(
        'SELECT * FROM caregiver_profiles WHERE user_id = $1',
        [testUserId]
      );
      expect(sqlRes.rows).toHaveLength(1);
      const row = sqlRes.rows[0];
      expect(row.user_id).toBe(testUserId);
      expect(row.state_code).toBe('GA');
      expect(row.application_status).toBe('draft');
    });

    it('advances through Steps 2, 3, and 4 preserving previous state', async () => {
      // Step 1
      await saveCaregiverDraftDb(testUserId, GA_ORG_ID, 'GA', 1, {
        first_name: 'Janelle',
        last_name: 'Whitfield',
        email: 'janelle.w@example.com',
        phone: '(404) 555-0182',
        dob: '1992-04-15',
        address: { street: '123 Peachtree Way', city: 'Atlanta', state: 'GA', zip: '30305' },
      });

      // Step 2: Positions & Availability
      const step2 = await saveCaregiverDraftDb(testUserId, GA_ORG_ID, 'GA', 2, {
        positions_applied: ['cna', 'pca'],
        availability: {
          full_time: true,
          part_time: false,
          prn: false,
          days_available: ['mon', 'tue', 'wed', 'thu', 'fri'],
          shifts_available: ['mornings', 'afternoons'],
          max_weekly_hours: 40,
          willing_to_travel_miles: 25,
        },
      });
      expect(step2.application_step).toBe(2);
      expect(step2.personal_info.first_name).toBe('Janelle');
      expect(step2.positions_applied).toEqual(['cna', 'pca']);

      // Step 3: Experience & References
      const step3 = await saveCaregiverDraftDb(testUserId, GA_ORG_ID, 'GA', 3, {
        experience_history: [
          {
            employer_name: 'Piedmont Hospital',
            job_title: 'CNA Caregiver',
            start_date: '2021-01-01',
            end_date: '2024-01-01',
          },
        ],
        references: [
          {
            name: 'Dr. Sarah Connor',
            relationship: 'supervisor',
            phone: '(404) 555-9000',
            years_known: 3,
          },
        ],
      });
      expect(step3.application_step).toBe(3);
      expect(step3.experience_history).toHaveLength(1);
      expect(step3.references).toHaveLength(1);

      // Step 4: Professional Licenses
      const step4 = await saveCaregiverDraftDb(testUserId, GA_ORG_ID, 'GA', 4, {
        professional_licenses: [
          {
            license_type: 'CNA',
            license_number: 'GA-CNA-998822',
            issuing_state: 'GA',
            expiration_date: '2027-12-31',
          },
        ],
      });
      expect(step4.application_step).toBe(4);
      expect(step4.professional_licenses).toHaveLength(1);

      // Fetch via getCaregiverProfileDb helper
      const fetched = await getCaregiverProfileDb(testUserId);
      expect(fetched).not.toBeNull();
      expect(fetched?.application_step).toBe(4);
      expect(fetched?.positions_applied).toEqual(['cna', 'pca']);
      expect(fetched?.professional_licenses[0].license_type).toBe('CNA');
    });
  });

  // ─── 4. Full Application Submission ───────────────────────────────────────

  describe('submitCaregiverApplicationDb()', () => {
    const testUserId = 'test-caregiver-submit-001';

    beforeEach(async () => {
      await saveCaregiverDraftDb(testUserId, IN_ORG_ID, 'IN', 1, {
        first_name: 'Marcus',
        last_name: 'Brody',
        email: 'marcus.b@example.com',
        phone: '(317) 555-1122',
        dob: '1988-08-20',
        address: { street: '456 Meridian St', city: 'Indianapolis', state: 'IN', zip: '46204' },
      });
    });

    it('submits application, updates status to submitted, and updates onboarding checklist', async () => {
      const disclosures: Partial<LegalDisclosures> = {
        authorized_to_work_in_us: true,
        felony_conviction: false,
        drug_screen_consent: true,
        background_check_consent: true,
        attestation_signature: 'Marcus Brody',
        attestation_timestamp: new Date().toISOString(),
      };

      const submitted = await submitCaregiverApplicationDb(testUserId, disclosures);
      expect(submitted).not.toBeNull();
      expect(submitted?.application_status).toBe('submitted');
      expect(submitted?.application_step).toBe(5);
      expect(submitted?.submitted_at).toBeDefined();
      expect(submitted?.onboarding_checklist.application_form).toBe('submitted');
      expect(submitted?.legal_disclosures.attestation_signature).toBe('Marcus Brody');

      // Verify directly with SQL query
      const db = getDb();
      const sqlRes = await db.query<any>(
        'SELECT * FROM caregiver_profiles WHERE user_id = $1',
        [testUserId]
      );
      expect(sqlRes.rows).toHaveLength(1);
      const row = sqlRes.rows[0];
      expect(row.application_status).toBe('submitted');
      expect(row.application_step).toBe(5);
      expect(row.submitted_at).toBeDefined();
    });

    it('returns null when submitting for a nonexistent userId', async () => {
      const res = await submitCaregiverApplicationDb('nonexistent-user', {});
      expect(res).toBeNull();
    });
  });

  // ─── 5. E-Signature Envelope Lifecycle with SHA-256 Hash Stamp ─────────────

  describe('E-Signature Envelope Lifecycle in PostgreSQL', () => {
    it('creates, retrieves, completes, and cryptographically stamps an envelope', async () => {
      // 1. Create envelope
      const created = await createSignatureEnvelopeDb({
        org_id: GA_ORG_ID,
        template_type: 'caregiver_onboarding_packet',
        signer_name: 'Janelle Whitfield',
        signer_email: 'janelle.w@example.com',
        signer_user_id: 'user-001',
      });

      expect(created.id).toMatch(/^env-\d+-[a-z0-9]+$/);
      expect(created.status).toBe('sent');
      expect(created.signer_role).toBe('caregiver');
      expect(created.title).toBe('Caregiver Onboarding & Attestation Packet');
      expect(created.signature_base64).toBeUndefined();
      expect(created.signed_document_hash).toBeUndefined();

      // 2. Get envelope by ID
      const retrieved = await getSignatureEnvelopeDb(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.signer_name).toBe('Janelle Whitfield');

      // 3. Complete envelope signature
      const completed = await completeSignatureEnvelopeDb(
        created.id,
        SAMPLE_BASE64_SIG,
        '10.0.0.42',
        'Crystal-Esign-TestBrowser/1.0'
      );

      expect(completed).not.toBeNull();
      expect(completed?.status).toBe('completed');
      expect(completed?.signature_base64).toBe(SAMPLE_BASE64_SIG);
      expect(completed?.ip_address).toBe('10.0.0.42');
      expect(completed?.user_agent).toBe('Crystal-Esign-TestBrowser/1.0');
      expect(completed?.signed_at).toBeDefined();
      expect(completed?.signed_document_hash).toHaveLength(64);

      // Verify SHA-256 hash stamp determinism
      const expectedHash = computeDocumentHash({
        envelope_id: created.id,
        org_id: created.org_id,
        signer_name: created.signer_name,
        signer_email: created.signer_email,
        signed_at: completed!.signed_at!,
        signature_base64: SAMPLE_BASE64_SIG,
      });
      expect(completed?.signed_document_hash).toBe(expectedHash);

      // 4. Query via SQL to verify direct PostgreSQL storage
      const db = getDb();
      const sqlRes = await db.query<any>(
        'SELECT * FROM signature_envelopes WHERE id = $1',
        [created.id]
      );
      expect(sqlRes.rows).toHaveLength(1);
      const row = sqlRes.rows[0];
      expect(row.status).toBe('completed');
      expect(row.signed_document_hash).toBe(expectedHash);

      // 5. List envelopes
      const list = await listSignatureEnvelopesDb(GA_ORG_ID);
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list.some((e) => e.id === created.id)).toBe(true);
    });

    it('returns null when completing a nonexistent envelope', async () => {
      const res = await completeSignatureEnvelopeDb('nonexistent-env', SAMPLE_BASE64_SIG);
      expect(res).toBeNull();
    });
  });

  // ─── 6. Public Inquiries Operations ───────────────────────────────────────

  describe('Public Inquiries PostgreSQL Operations', () => {
    it('saves a new inquiry and retrieves it with filtering', async () => {
      const newInquiry = await savePublicInquiryDb({
        org_id: GA_ORG_ID,
        state_code: 'GA',
        full_name: 'Sarah Connor',
        email: 'sarah.c@example.com',
        phone: '(404) 555-7788',
        inquiry_type: 'client_care_inquiry',
        message: 'Need 24/7 care assistance in Fulton County.',
        source_url: 'https://withopenhands.com/contact',
        ip_address: '127.0.0.1',
      });

      expect(newInquiry.id).toMatch(/^inq-/);
      expect(newInquiry.full_name).toBe('Sarah Connor');
      expect(newInquiry.status).toBe('new');

      // List all inquiries for GA
      const gaInquiries = await listPublicInquiriesDb(GA_ORG_ID, 'GA');
      expect(gaInquiries.some((i) => i.id === newInquiry.id)).toBe(true);

      // Direct SQL check
      const db = getDb();
      const sqlRes = await db.query<any>(
        'SELECT * FROM public_inquiries WHERE id = $1',
        [newInquiry.id]
      );
      expect(sqlRes.rows).toHaveLength(1);
      expect(sqlRes.rows[0].full_name).toBe('Sarah Connor');
    });
  });
});
