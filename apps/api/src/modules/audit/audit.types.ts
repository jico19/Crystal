import type { SecurityAuditEventType } from '@crystal/types';

export interface LogAuditEventParams {
  userId?: string | null;
  orgId?: string | null;
  eventType: SecurityAuditEventType;
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AuditLogQueryFilters {
  eventType?: SecurityAuditEventType;
  orgId?: string;
  userId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}
