import { describe, it, expect, beforeEach } from 'vitest';
import {
  ClientAuthorizationSchema,
  LogUtilizationSchema,
} from '../packages/validation/src';
import {
  createClientAuthorizationDb,
  getClientAuthorizationsDb,
  getClientAuthorizationByIdDb,
  logAuthorizationUtilizationDb,
  getExpiringAuthorizationsDb,
  getAuthorizationSummaryDb,
} from '../apps/api/src/lib/db';
import {
  mockClientAuthorizations,
  computeAuthorizationSummary,
} from '../apps/api/src/lib/store';
import type { CreateAuthorizationInput, ClientAuthorization } from '../packages/types/src';

const GA_ORG_ID = '00000000-0000-0000-0000-000000000001';
const IN_ORG_ID = '00000000-0000-0000-0000-000000000002';

describe('Feature Spec 06: Client Prior Authorization & Utilization Management', () => {
  beforeEach(() => {
    // Preserve seeded auth-001 and auth-002
    Array.from(mockClientAuthorizations.keys()).forEach((k) => {
      if (k !== 'auth-001' && k !== 'auth-002') {
        mockClientAuthorizations.delete(k);
      }
    });
  });

  describe('1. Zod Validation Schemas', () => {
    it('validates a complete client prior authorization payload', () => {
      const validPayload = {
        client_id: 'cli-001',
        org_id: GA_ORG_ID,
        payer_name: 'Georgia Medicaid / CCSP Waiver',
        authorization_number: 'GA-PA-99120',
        procedure_code: 'T1019',
        service_type: 'Personal Support Services',
        start_date: '2026-06-01',
        end_date: '2026-12-31',
        total_units_authorized: 500, // 125 hours
        weekly_hours_cap: 25,
        notes: 'Approved personal care for morning assistance.',
      };

      const parsed = ClientAuthorizationSchema.safeParse(validPayload);
      expect(parsed.success).toBe(true);
    });

    it('rejects authorization when end_date is before or equal to start_date', () => {
      const invalidDates = {
        client_id: 'cli-001',
        org_id: GA_ORG_ID,
        payer_name: 'Georgia Medicaid',
        authorization_number: 'GA-PA-99121',
        procedure_code: 'T1019',
        service_type: 'Personal Support',
        start_date: '2026-12-31',
        end_date: '2026-06-01', // Before start
        total_units_authorized: 500,
      };

      const parsed = ClientAuthorizationSchema.safeParse(invalidDates);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.end_date).toBeDefined();
      }
    });

    it('rejects authorization with zero or negative units authorized', () => {
      const zeroUnits = {
        client_id: 'cli-001',
        org_id: GA_ORG_ID,
        payer_name: 'Georgia Medicaid',
        authorization_number: 'GA-PA-99122',
        procedure_code: 'T1019',
        service_type: 'Personal Support',
        start_date: '2026-01-01',
        end_date: '2026-06-30',
        total_units_authorized: 0,
      };

      const parsed = ClientAuthorizationSchema.safeParse(zeroUnits);
      expect(parsed.success).toBe(false);
    });

    it('validates shift utilization logging payload', () => {
      const validLog = {
        units_to_log: 16, // 4 hours
        service_date: '2026-09-02',
        caregiver_id: 'cg-101',
        notes: 'Completed morning shower and meal prep.',
      };

      const parsed = LogUtilizationSchema.safeParse(validLog);
      expect(parsed.success).toBe(true);

      const invalidLog = {
        units_to_log: -4,
        service_date: '2026-09-02',
      };

      const invalidParsed = LogUtilizationSchema.safeParse(invalidLog);
      expect(invalidParsed.success).toBe(false);
    });
  });

  describe('2. Authorization Creation & Database Operations', () => {
    it('creates a new authorization and retrieves it by ID', async () => {
      const input: CreateAuthorizationInput = {
        client_id: 'cli-001',
        org_id: GA_ORG_ID,
        payer_name: 'UnitedHealthcare Community Plan',
        authorization_number: 'UHC-GA-77182',
        procedure_code: 'S5125',
        service_type: 'Attendant Care',
        start_date: '2026-09-01',
        end_date: '2027-03-01',
        total_units_authorized: 480, // 120 hours
        weekly_hours_cap: 20,
      };

      const created = await createClientAuthorizationDb(input);
      expect(created.id).toBeDefined();
      expect(created.authorization_number).toBe('UHC-GA-77182');
      expect(created.total_units_used).toBe(0);

      const fetched = await getClientAuthorizationByIdDb(created.id);
      expect(fetched).toBeDefined();
      expect(fetched?.payer_name).toBe('UnitedHealthcare Community Plan');
      expect(fetched?.total_units_authorized).toBe(480);
    });

    it('isolates authorizations by organization tenant boundary', async () => {
      const gaAuths = await getClientAuthorizationsDb(undefined, GA_ORG_ID);
      expect(gaAuths.every((a) => a.org_id === GA_ORG_ID)).toBe(true);

      const inAuths = await getClientAuthorizationsDb(undefined, IN_ORG_ID);
      expect(inAuths.every((a) => a.org_id === IN_ORG_ID)).toBe(true);
    });
  });

  describe('3. Unit Consumption Burn-Down & Automatic Status Transitions', () => {
    it('records shift utilization and recalculates remaining units and hours', async () => {
      const input: CreateAuthorizationInput = {
        client_id: 'cli-002',
        org_id: IN_ORG_ID,
        payer_name: 'Indiana FSSA Waiver',
        authorization_number: 'IN-TEST-BURN',
        procedure_code: 'T1019',
        service_type: 'Personal Care',
        start_date: '2026-09-01',
        end_date: '2026-12-31',
        total_units_authorized: 100, // 25 hours
        weekly_hours_cap: 10,
      };

      const auth = await createClientAuthorizationDb(input);

      // Log 24 units (6 hours)
      const res1 = await logAuthorizationUtilizationDb(auth.id, {
        units_to_log: 24,
        service_date: '2026-09-02',
        notes: 'Shift 1',
      });

      expect(res1.success).toBe(true);
      expect(res1.authorization?.total_units_used).toBe(24);
      expect(res1.summary?.remaining_units).toBe(76);
      expect(res1.summary?.total_hours_used).toBe(6);
      expect(res1.summary?.remaining_hours).toBe(19);
      expect(res1.summary?.percent_utilized).toBe(24);

      // Log remaining 76 units to reach 100% capacity
      const res2 = await logAuthorizationUtilizationDb(auth.id, {
        units_to_log: 76,
        service_date: '2026-09-10',
        notes: 'Shift 2 - final hours',
      });

      expect(res2.success).toBe(true);
      expect(res2.authorization?.total_units_used).toBe(100);
      expect(res2.summary?.remaining_units).toBe(0);
      expect(res2.summary?.is_exhausted).toBe(true);
      expect(res2.summary?.status).toBe('exhausted');
    });
  });

  describe('4. Proactive Expiration Tracking & Summary Generator', () => {
    it('identifies authorizations expiring within 60-day window', async () => {
      const expiringList = await getExpiringAuthorizationsDb(GA_ORG_ID, 60);
      expect(expiringList.length).toBeGreaterThanOrEqual(1);

      const gaAuth001 = expiringList.find((a) => a.id === 'auth-001');
      expect(gaAuth001).toBeDefined();
      expect(gaAuth001?.summary.is_expiring_soon).toBe(true);
    });

    it('computes utilization summary metrics including hours conversion and weekly cap', async () => {
      const authSummary = await getAuthorizationSummaryDb('auth-001');
      expect(authSummary).toBeDefined();
      expect(authSummary?.total_units_authorized).toBe(400);
      expect(authSummary?.total_hours_authorized).toBe(100); // 400 / 4
      expect(authSummary?.total_hours_used).toBe(30); // 120 / 4
      expect(authSummary?.weekly_hours_cap).toBe(25);
      expect(authSummary?.status).toBe('expiring_soon');
    });
  });
});
