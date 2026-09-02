import { describe, it, expect, beforeEach } from 'vitest';
import {
  ClientIntakeSchema,
  ClientDocumentUploadSchema,
} from '../packages/validation/src';
import {
  createClientProfileDb,
  getClientProfileDb,
  listClientsDb,
  uploadClientDocumentDb,
  listClientDocumentsDb,
} from '../apps/api/src/lib/db';
import {
  mockClients,
  mockClientDocuments,
} from '../apps/api/src/lib/store';
import type { ClientIntakeInput } from '../packages/types/src';

const GA_ORG_ID = '00000000-0000-0000-0000-000000000001';
const IN_ORG_ID = '00000000-0000-0000-0000-000000000002';

describe('Feature Spec 05: Client Intake & Document Management', () => {
  beforeEach(() => {
    // Keep seeded cli-001 and cli-002
    Array.from(mockClients.keys()).forEach((k) => {
      if (k !== 'cli-001' && k !== 'cli-002') {
        mockClients.delete(k);
      }
    });
  });

  describe('1. Zod Validation Schemas', () => {
    it('validates a complete client intake submission', () => {
      const payload: ClientIntakeInput = {
        org_id: GA_ORG_ID,
        state_code: 'GA',
        first_name: 'Beatrice',
        last_name: 'Holloway',
        dob: '1940-06-18',
        gender: 'Female',
        ssn_last4: '9921',
        medicaid_id: 'GA-MED-55102',
        primary_phone: '(404) 555-4422',
        service_address: {
          street: '3500 Lenox Rd NE',
          apt: 'Suite 200',
          city: 'Atlanta',
          state: 'GA',
          zip: '30326',
        },
        emergency_contacts: [
          {
            name: 'Thomas Holloway',
            relationship: 'Son',
            phone: '(404) 555-9988',
            is_primary: true,
            has_poa: true,
          },
        ],
        primary_physician: {
          name: 'Dr. Emily Watson, MD',
          practice: 'Piedmont Internal Medicine',
          phone: '(404) 555-3000',
        },
        care_needs: {
          adls: ['bathing', 'dressing', 'transferring'],
          iadls: ['meal_prep', 'medication_reminders'],
          allergies: ['Penicillin'],
          diagnoses: ['Congestive Heart Failure (CHF)', 'Osteoporosis'],
        },
        primary_payer: 'medicaid_waiver',
      };

      const parsed = ClientIntakeSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    it('rejects intake submission without emergency contacts', () => {
      const invalidPayload = {
        org_id: GA_ORG_ID,
        state_code: 'GA',
        first_name: 'Beatrice',
        last_name: 'Holloway',
        dob: '1940-06-18',
        primary_phone: '(404) 555-4422',
        service_address: {
          street: '3500 Lenox Rd NE',
          city: 'Atlanta',
          state: 'GA',
          zip: '30326',
        },
        emergency_contacts: [], // empty
        primary_physician: {
          name: 'Dr. Emily Watson',
          phone: '(404) 555-3000',
        },
        care_needs: { adls: [], iadls: [], allergies: [], diagnoses: [] },
        primary_payer: 'private_pay',
      };

      const parsed = ClientIntakeSchema.safeParse(invalidPayload);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.emergency_contacts).toBeDefined();
      }
    });

    it('validates client document upload payload', () => {
      const validDocUpload = {
        client_id: '00000000-0000-0000-0000-000000000001',
        org_id: GA_ORG_ID,
        doc_type: 'physician_orders_485',
        file_name: 'cms_485_plan_of_care.pdf',
        file_size_bytes: 1024 * 350,
        mime_type: 'application/pdf',
        effective_date: '2026-09-01',
        expiration_date: '2026-11-01',
      };

      const parsed = ClientDocumentUploadSchema.safeParse(validDocUpload);
      expect(parsed.success).toBe(true);
    });
  });

  describe('2. Client Intake Persistence & Multi-Tenant Isolation', () => {
    it('creates and retrieves a new client intake profile', async () => {
      const input: ClientIntakeInput = {
        org_id: IN_ORG_ID,
        state_code: 'IN',
        first_name: 'Clarence',
        last_name: 'Darrow',
        dob: '1948-02-14',
        gender: 'Male',
        primary_phone: '(317) 555-8822',
        service_address: {
          street: '500 N Capitol Ave',
          city: 'Indianapolis',
          state: 'IN',
          zip: '46204',
        },
        emergency_contacts: [
          {
            name: 'Alice Darrow',
            relationship: 'Spouse',
            phone: '(317) 555-9911',
            is_primary: true,
            has_poa: true,
          },
        ],
        primary_physician: {
          name: 'Dr. Samuel Evans',
          phone: '(317) 555-6000',
        },
        care_needs: {
          adls: ['bathing', 'ambulation'],
          iadls: ['meal_prep'],
          allergies: [],
          diagnoses: ['Parkinson\'s Disease'],
        },
        primary_payer: 'private_pay',
      };

      const created = await createClientProfileDb(input);
      expect(created.id).toBeDefined();
      expect(created.status).toBe('intake_pending');
      expect(created.first_name).toBe('Clarence');

      const retrieved = await getClientProfileDb(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.last_name).toBe('Darrow');
      expect(retrieved?.care_needs.diagnoses).toContain('Parkinson\'s Disease');
    });

    it('isolates clients by organization and state boundaries', async () => {
      const gaClients = await listClientsDb(GA_ORG_ID, 'GA');
      expect(gaClients.every((c) => c.org_id === GA_ORG_ID && c.state_code === 'GA')).toBe(true);

      const inClients = await listClientsDb(IN_ORG_ID, 'IN');
      expect(inClients.every((c) => c.org_id === IN_ORG_ID && c.state_code === 'IN')).toBe(true);
    });
  });

  describe('3. Client Document Storage & Vault', () => {
    it('uploads and lists documents for a client profile', async () => {
      const doc = await uploadClientDocumentDb({
        client_id: 'cli-001',
        org_id: GA_ORG_ID,
        doc_type: 'rn_assessment',
        file_storage_path: 'clients/cli-001/rn_assessment_2026.pdf',
        file_name: 'Initial_RN_Assessment.pdf',
        file_size_bytes: 450000,
        mime_type: 'application/pdf',
        effective_date: '2026-09-02',
      });

      expect(doc.id).toBeDefined();
      expect(doc.doc_type).toBe('rn_assessment');

      const docs = await listClientDocumentsDb('cli-001');
      expect(docs.length).toBeGreaterThanOrEqual(1);
      const docTypes = docs.map((d) => d.doc_type);
      expect(docTypes).toContain('rn_assessment');
    });
  });
});
