import { adminRepository } from './admin.repository.js';
import type { AdminKpiMetrics, AggregatedKpis, UrgentActionItem } from './admin.types.js';

export class AdminService {
  async getKpis(stateCode?: string): Promise<{
    aggregated: AggregatedKpis;
    urgentActions: UrgentActionItem[];
  }> {
    const rows = await adminRepository.getKpis(stateCode);
    const urgentActions = await adminRepository.getUrgentActions(stateCode);

    let totalCaregivers = 0;
    let activeCaregivers = 0;
    let totalClients = 0;
    let activeClients = 0;
    let totalActiveAuthorizations = 0;
    let atRiskAuthorizations = 0;
    let pendingReviews = 0;
    let expiredDocs = 0;
    let pendingSigs = 0;

    for (const r of rows) {
      totalCaregivers += Number(r.total_caregivers);
      activeCaregivers += Number(r.active_caregivers);
      totalClients += Number(r.total_clients);
      activeClients += Number(r.active_clients);
      totalActiveAuthorizations += Number(r.total_active_authorizations);
      atRiskAuthorizations += Number(r.at_risk_authorizations);
      pendingReviews += Number(r.pending_document_reviews);
      expiredDocs += Number(r.expired_documents_count);
      pendingSigs += Number(r.pending_signatures_count);
    }

    const aggregated: AggregatedKpis = {
      total_caregivers: totalCaregivers,
      active_caregivers: activeCaregivers,
      total_clients: totalClients,
      active_clients: activeClients,
      total_active_authorizations: totalActiveAuthorizations,
      at_risk_authorizations: atRiskAuthorizations,
      pending_document_reviews: pendingReviews,
      expired_documents_count: expiredDocs,
      pending_signatures_count: pendingSigs,
      state_breakdown: rows,
    };

    return { aggregated, urgentActions };
  }

  async generateAuditPacketCsv(stateCode?: string): Promise<string> {
    const rows = await adminRepository.getAuditPacketExportRows(stateCode);

    const headers = [
      'State Code',
      'Agency Name',
      'Record Type',
      'Individual Name',
      'Record Status',
      'Document / Service Code',
      'Compliance / Verification Status',
      'Expiration / End Date',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const csvLines = [headers.join(',')];

    for (const r of rows) {
      csvLines.push(
        [
          escapeCsv(r.state_code),
          escapeCsv(r.agency_name),
          escapeCsv(r.record_type),
          escapeCsv(r.individual_name),
          escapeCsv(r.status),
          escapeCsv(r.document_or_service),
          escapeCsv(r.compliance_status),
          escapeCsv(r.expiration_or_end_date),
        ].join(',')
      );
    }

    return csvLines.join('\n');
  }

  async getReferralSources(stateCode?: string): Promise<any[]> {
    return await adminRepository.getReferralSourcesReport(stateCode);
  }

  async getTrainingCompliance(stateCode?: string): Promise<any[]> {
    return await adminRepository.getTrainingComplianceReport(stateCode);
  }

  async getAuthorizationsSummary(stateCode?: string): Promise<any[]> {
    return await adminRepository.getAuthorizationsSummaryReport(stateCode);
  }
}

export const adminService = new AdminService();
