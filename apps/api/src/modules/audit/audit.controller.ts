import type { Request, Response } from 'express';
import { AuditLogQuerySchema } from '@crystal/validation';
import { auditService } from './audit.service.js';

export class AuditController {
  /**
   * GET /api/v1/audit/logs
   * Retrieve paginated, filtered audit logs.
   * Access: super_admin (global), agency_admin (scoped to own org).
   */
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    const parseResult = AuditLogQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid audit log query parameters',
        details: parseResult.error.format(),
      });
      return;
    }

    const { event_type, org_id, user_id, from_date, to_date, page, page_size } = parseResult.data;

    // Multi-tenant boundary protection:
    // If not super_admin, force the query to be strictly scoped to user's assigned org_id
    let effectiveOrgId = org_id;
    if (req.user?.role !== 'super_admin') {
      effectiveOrgId = req.user?.org_id;
      if (!effectiveOrgId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: No organization context associated with user account',
        });
        return;
      }
    }

    const result = await auditService.getAuditLogs({
      eventType: event_type,
      orgId: effectiveOrgId,
      userId: user_id,
      fromDate: from_date,
      toDate: to_date,
      page,
      pageSize: page_size,
    });

    res.json({
      success: true,
      data: {
        logs: result.logs,
        pagination: {
          total: result.total,
          page,
          pageSize: page_size,
          totalPages: Math.ceil(result.total / page_size),
        },
      },
    });
  }
}

export const auditController = new AuditController();
