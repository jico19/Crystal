import { db } from '../../db/index.js';
import type { AdminKpiMetrics, UrgentActionItem } from './admin.types.js';

export class AdminRepository {
  async getKpis(stateCode?: string): Promise<AdminKpiMetrics[]> {
    let query = `SELECT * FROM public.admin_kpi_metrics`;
    const values: any[] = [];

    if (stateCode && stateCode !== 'ALL') {
      query += ` WHERE state_code = $1`;
      values.push(stateCode);
    }

    query += ` ORDER BY state_code ASC;`;
    const res = await db.query(query, values);
    return res.rows;
  }

  async getUrgentActions(stateCode?: string): Promise<UrgentActionItem[]> {
    const items: UrgentActionItem[] = [];

    // 1. Pending document reviews
    const docQuery = `
      cd.id, cd.category, cd.created_at, o.state_code,
      CONCAT(cp.personal_info->>'first_name', ' ', cp.personal_info->>'last_name') as caregiver_name
      FROM public.caregiver_documents cd
      JOIN public.organizations o ON o.id = cd.org_id
      JOIN public.caregiver_profiles cp ON cp.id = cd.caregiver_id
      WHERE cd.verification_status = 'under_review'
    `;
    const docRes = await db.query(
      `SELECT ${docQuery} ${stateCode && stateCode !== 'ALL' ? 'AND o.state_code = $1' : ''} ORDER BY cd.created_at ASC LIMIT 10;`,
      stateCode && stateCode !== 'ALL' ? [stateCode] : []
    );

    docRes.rows.forEach((r) => {
      items.push({
        id: r.id,
        type: 'document_review',
        title: `Pending Document Review: ${r.category}`,
        description: `Caregiver ${r.caregiver_name} uploaded ${r.category} requiring clinical review.`,
        severity: 'medium',
        state_code: r.state_code,
        created_at: r.created_at,
      });
    });

    // 2. Expiring / at-risk authorizations
    const authQuery = `
      ca.id, ca.auth_number, ca.end_date, ca.status, o.state_code,
      CONCAT(c.first_name, ' ', c.last_name) as client_name
      FROM public.client_authorizations ca
      JOIN public.organizations o ON o.id = ca.org_id
      JOIN public.clients c ON c.id = ca.client_id
      WHERE ca.status IN ('expiring_soon', 'exhausted')
    `;
    const authRes = await db.query(
      `SELECT ${authQuery} ${stateCode && stateCode !== 'ALL' ? 'AND o.state_code = $1' : ''} ORDER BY ca.end_date ASC LIMIT 10;`,
      stateCode && stateCode !== 'ALL' ? [stateCode] : []
    );

    authRes.rows.forEach((r) => {
      items.push({
        id: r.id,
        type: 'expiring_auth',
        title: `Authorization ${r.status.toUpperCase()}: #${r.auth_number}`,
        description: `Client ${r.client_name} prior authorization ${r.auth_number} requires renewal or hours extension.`,
        severity: 'high',
        state_code: r.state_code,
        created_at: r.end_date,
      });
    });

    return items;
  }

  async getAuditPacketExportRows(stateCode?: string): Promise<any[]> {
    const query = `
      SELECT
        o.state_code,
        o.name as agency_name,
        'Caregiver' as record_type,
        CONCAT(cp.personal_info->>'first_name', ' ', cp.personal_info->>'last_name') as individual_name,
        cp.application_status::text as status,
        COALESCE(cd.category::text, 'N/A') as document_or_service,
        COALESCE(cd.verification_status::text, 'N/A') as compliance_status,
        cd.expiration_date as expiration_or_end_date
      FROM public.caregiver_profiles cp
      JOIN public.organizations o ON o.id = cp.org_id
      LEFT JOIN public.caregiver_documents cd ON cd.caregiver_id = cp.id
      ${stateCode && stateCode !== 'ALL' ? 'WHERE o.state_code = $1' : ''}

      UNION ALL

      SELECT
        o.state_code,
        o.name as agency_name,
        'Client' as record_type,
        CONCAT(c.first_name, ' ', c.last_name) as individual_name,
        c.status::text as status,
        COALESCE(ca.service_code, 'N/A') as document_or_service,
        COALESCE(ca.status::text, 'N/A') as compliance_status,
        ca.end_date as expiration_or_end_date
      FROM public.clients c
      JOIN public.organizations o ON o.id = c.org_id
      LEFT JOIN public.client_authorizations ca ON ca.client_id = c.id
      ${stateCode && stateCode !== 'ALL' ? 'WHERE o.state_code = $1' : ''}
      ORDER BY state_code, record_type, individual_name;
    `;

    const res = await db.query(
      query,
      stateCode && stateCode !== 'ALL' ? [stateCode] : []
    );
    return res.rows;
  }

  async getReferralSourcesReport(stateCode?: string): Promise<any[]> {
    const query = `
      SELECT 
        o.state_code,
        COALESCE(i.inquiry_type, 'general_question') as channel_type,
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE i.status = 'converted') as converted_leads,
        COUNT(*) FILTER (WHERE i.status = 'new') as pending_leads
      FROM public.public_inquiries i
      JOIN public.organizations o ON o.id = i.org_id
      ${stateCode && stateCode !== 'ALL' ? 'WHERE o.state_code = $1' : ''}
      GROUP BY o.state_code, i.inquiry_type
      ORDER BY total_leads DESC;
    `;
    const res = await db.query(query, stateCode && stateCode !== 'ALL' ? [stateCode] : []);
    return res.rows;
  }

  async getTrainingComplianceReport(stateCode?: string): Promise<any[]> {
    const query = `
      SELECT 
        o.state_code,
        CONCAT(cp.personal_info->>'first_name', ' ', cp.personal_info->>'last_name') as caregiver_name,
        cp.application_status,
        COUNT(tp.id) as modules_started,
        COUNT(tp.id) FILTER (WHERE tp.quiz_passed = true) as modules_passed,
        COUNT(tp.id) FILTER (WHERE tp.certificate_issued = true) as certificates_earned
      FROM public.caregiver_profiles cp
      JOIN public.organizations o ON o.id = cp.org_id
      LEFT JOIN public.caregiver_training_progress tp ON tp.caregiver_id = cp.id
      ${stateCode && stateCode !== 'ALL' ? 'WHERE o.state_code = $1' : ''}
      GROUP BY o.state_code, cp.id, cp.personal_info, cp.application_status
      ORDER BY o.state_code, caregiver_name;
    `;
    const res = await db.query(query, stateCode && stateCode !== 'ALL' ? [stateCode] : []);
    return res.rows;
  }

  async getAuthorizationsSummaryReport(stateCode?: string): Promise<any[]> {
    const query = `
      SELECT 
        o.state_code,
        CONCAT(c.first_name, ' ', c.last_name) as client_name,
        ca.auth_number,
        ca.service_code,
        ca.total_units_authorized,
        ca.total_units_used,
        (ca.total_units_authorized - ca.total_units_used) as units_remaining,
        ROUND(((ca.total_units_used::numeric / NULLIF(ca.total_units_authorized, 0)) * 100), 1) as burn_percentage,
        ca.start_date,
        ca.end_date,
        ca.status
      FROM public.client_authorizations ca
      JOIN public.clients c ON c.id = ca.client_id
      JOIN public.organizations o ON o.id = ca.org_id
      ${stateCode && stateCode !== 'ALL' ? 'WHERE o.state_code = $1' : ''}
      ORDER BY ca.end_date ASC;
    `;
    const res = await db.query(query, stateCode && stateCode !== 'ALL' ? [stateCode] : []);
    return res.rows;
  }
}

export const adminRepository = new AdminRepository();
