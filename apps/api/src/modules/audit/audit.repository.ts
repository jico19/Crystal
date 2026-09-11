import { db, SqlQueryBuilder } from '../../db/index.js';
import type { LogAuditEventParams, AuditLogQueryFilters } from './audit.types.js';
import type { SecurityAuditLog } from '@crystal/types';

export class AuditRepository {
  /**
   * Append an immutable audit record to security_audit_logs
   */
  async insertAuditLog(params: LogAuditEventParams): Promise<string> {
    const query = `
      INSERT INTO public.security_audit_logs (
        user_id, org_id, event_type, resource_type, resource_id, ip_address, user_agent, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id;
    `;
    const values = [
      params.userId || null,
      params.orgId || null,
      params.eventType,
      params.resourceType,
      params.resourceId || null,
      params.ipAddress || null,
      params.userAgent || null,
      JSON.stringify(params.metadata || {}),
    ];

    const result = await db.query(query, values);
    return result.rows[0].id;
  }

  /**
   * Query paginated audit logs with optional filters
   */
  async findAuditLogs(filters: AuditLogQueryFilters): Promise<{ logs: SecurityAuditLog[]; total: number }> {
    const qb = new SqlQueryBuilder();

    if (filters.eventType) {
      qb.addWhere('event_type =', filters.eventType);
    }

    if (filters.orgId) {
      qb.addWhere('org_id =', filters.orgId);
    }

    if (filters.userId) {
      qb.addWhere('user_id =', filters.userId);
    }

    if (filters.fromDate) {
      qb.addWhere('created_at >=', filters.fromDate);
    }

    if (filters.toDate) {
      qb.addWhere('created_at <=', filters.toDate);
    }

    const whereClause = qb.getWhereClause();
    const countValues = qb.getValues();

    // Fetch paginated rows
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const pageSize = filters.pageSize && filters.pageSize > 0 ? Math.min(filters.pageSize, 100) : 25;
    const offset = (page - 1) * pageSize;
    const { limitParam, offsetParam } = qb.paginate(pageSize, offset);

    const countPromise = db.query(
      `SELECT COUNT(*)::int as count FROM public.security_audit_logs ${whereClause};`,
      countValues
    );

    const dataQuery = `
      SELECT id, user_id, org_id, event_type, resource_type, resource_id, ip_address, user_agent, metadata, created_at
      FROM public.security_audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam};
    `;

    const [countRes, dataRes] = await Promise.all([
      countPromise,
      db.query(dataQuery, qb.getValues()),
    ]);

    return {
      logs: dataRes.rows,
      total: countRes.rows[0]?.count || 0,
    };
  }

  /**
   * Lock a user account due to security lockout
   */
  async lockUserProfile(userId: string, lockoutDurationMinutes: number = 15): Promise<void> {
    const query = `
      UPDATE public.user_profiles
      SET is_active = false,
          locked_until = NOW() + ($1 || ' minutes')::interval,
          failed_login_attempts = 5
      WHERE id = $2;
    `;
    await db.query(query, [lockoutDurationMinutes, userId]);
  }
}

export const auditRepository = new AuditRepository();
