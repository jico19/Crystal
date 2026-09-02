import { describe, it, expect } from 'vitest';
import {
  AdminKpiResponseSchema,
  AdminDashboardFilterSchema,
} from '../packages/validation/src';
import {
  getAdminDashboardMetricsDb,
  getAdminWorkQueuesDb,
  generateStateAuditReportDb,
  convertAuditReportToCsvDb,
} from '../apps/api/src/lib/db';
import {
  getAdminStateKpis,
  getAdminWorkQueues,
  generateStateAuditReport,
  convertAuditReportToCsv,
} from '../apps/api/src/lib/store';

describe('Feature Spec 07: Admin Command Center & State Reporting', () => {
  describe('1. Zod Validation Schemas', () => {
    it('validates a correct state KPI response payload', () => {
      const validKpi = {
        org_id: '00000000-0000-0000-0000-000000000001',
        state_code: 'GA',
        organization_name: 'With Open Hands',
        active_caregivers_count: 14,
        pending_applications_count: 3,
        pending_document_reviews_count: 5,
        active_clients_count: 22,
        expiring_authorizations_count: 2,
        total_units_authorized: 1000,
        total_units_used: 350,
        utilization_rate_pct: 35.0,
      };

      const parsed = AdminKpiResponseSchema.safeParse(validKpi);
      expect(parsed.success).toBe(true);
    });

    it('rejects KPI payload with negative counts or invalid state code', () => {
      const invalidKpi = {
        org_id: '00000000-0000-0000-0000-000000000001',
        state_code: 'NY', // Not supported
        organization_name: 'Unknown Care',
        active_caregivers_count: -1,
        pending_applications_count: 0,
        pending_document_reviews_count: 0,
        active_clients_count: 0,
        expiring_authorizations_count: 0,
        total_units_authorized: 0,
        total_units_used: 0,
        utilization_rate_pct: 0,
      };

      const parsed = AdminKpiResponseSchema.safeParse(invalidKpi);
      expect(parsed.success).toBe(false);
    });

    it('validates dashboard filter parameters', () => {
      expect(AdminDashboardFilterSchema.safeParse({ state_code: 'GA', format: 'csv' }).success).toBe(true);
      expect(AdminDashboardFilterSchema.safeParse({ state_code: 'ALL' }).success).toBe(true);
      expect(AdminDashboardFilterSchema.safeParse({ state_code: 'INVALID' }).success).toBe(false);
    });
  });

  describe('2. Multi-State KPI Aggregations & Metrics', () => {
    it('returns combined multi-state metrics for "ALL" filter', async () => {
      const metrics = await getAdminDashboardMetricsDb('ALL');
      expect(metrics.kpis).toBeDefined();
      expect(metrics.kpis.length).toBe(2);

      const gaKpi = metrics.kpis.find((k) => k.state_code === 'GA');
      const inKpi = metrics.kpis.find((k) => k.state_code === 'IN');

      expect(gaKpi).toBeDefined();
      expect(gaKpi?.organization_name).toBe('With Open Hands');
      expect(inKpi).toBeDefined();
      expect(inKpi?.organization_name).toBe('Cherish Open Arms');

      expect(metrics.totals.active_clients).toBeGreaterThanOrEqual(1);
      expect(metrics.totals.overall_utilization_pct).toBeGreaterThanOrEqual(0);
    });

    it('filters metrics exclusively to Georgia when state_code=GA', async () => {
      const metrics = await getAdminDashboardMetricsDb('GA');
      expect(metrics.kpis.every((k) => k.state_code === 'GA')).toBe(true);
      expect(metrics.kpis[0].organization_name).toBe('With Open Hands');
    });

    it('filters metrics exclusively to Indiana when state_code=IN', async () => {
      const metrics = await getAdminDashboardMetricsDb('IN');
      expect(metrics.kpis.every((k) => k.state_code === 'IN')).toBe(true);
      expect(metrics.kpis[0].organization_name).toBe('Cherish Open Arms');
    });
  });

  describe('3. Actionable Operational Work Queues', () => {
    it('returns actionable queue items across documents, applications, and authorizations', async () => {
      const queues = await getAdminWorkQueuesDb('ALL');
      expect(Array.isArray(queues)).toBe(true);

      // Verify structure of queue items
      queues.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(['document_review', 'application_review', 'expiring_authorization']).toContain(item.type);
        expect(['high', 'medium', 'low']).toContain(item.urgency);
        expect(item.action_url).toBeDefined();
      });
    });

    it('filters work queues strictly by tenant state code', async () => {
      const gaQueues = await getAdminWorkQueuesDb('GA');
      expect(gaQueues.every((q) => q.state_code === 'GA')).toBe(true);

      const inQueues = await getAdminWorkQueuesDb('IN');
      expect(inQueues.every((q) => q.state_code === 'IN')).toBe(true);
    });
  });

  describe('4. State Regulatory Audit Report & CSV Exporter', () => {
    it('generates state surveyor audit records containing credentials and CEU modules', async () => {
      const records = await generateStateAuditReportDb('ALL');
      expect(records.length).toBeGreaterThanOrEqual(1);

      const record = records[0];
      expect(record.caregiver_id).toBeDefined();
      expect(record.full_name).toBeDefined();
      expect(record.state_code).toBeDefined();
      expect(typeof record.compliance_score_pct).toBe('number');
      expect(record.cpr_status).toBeDefined();
      expect(record.tb_screen_status).toBeDefined();
    });

    it('exports audit records to RFC 4180 compliant CSV format', async () => {
      const records = await generateStateAuditReportDb('GA');
      const csv = convertAuditReportToCsvDb(records);

      expect(typeof csv).toBe('string');
      const lines = csv.split('\r\n');
      expect(lines.length).toBeGreaterThanOrEqual(2);

      // Verify headers
      expect(lines[0]).toContain('Caregiver ID,Full Name,State,Application Status,Compliance Score %');
      expect(lines[0]).toContain('CPR Certification,TB Screening,CNA License,Completed In-Service Modules');
    });
  });
});
