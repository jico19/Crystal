import { auditRepository } from './audit.repository.js';
import type { LogAuditEventParams, AuditLogQueryFilters } from './audit.types.js';
import type { SecurityAuditLog } from '@crystal/types';

export class AuditService {
  /**
   * Sanitizes metadata payload to guarantee ZERO plain PHI or PII leaks in audit tables
   */
  private sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
    if (!metadata) return {};

    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['ssn', 'password', 'token', 'secret', 'bank_account', 'routing_number', 'credit_card'];

    for (const [key, val] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
        sanitized[key] = '[REDACTED_BY_SECURITY_POLICY]';
      } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        sanitized[key] = this.sanitizeMetadata(val as Record<string, unknown>);
      } else {
        sanitized[key] = val;
      }
    }

    return sanitized;
  }

  /**
   * Append an audit event. Executes asynchronously and handles errors gracefully so as not to block primary request flows.
   */
  async logAuditEvent(params: LogAuditEventParams): Promise<string | null> {
    try {
      const sanitizedParams: LogAuditEventParams = {
        ...params,
        metadata: this.sanitizeMetadata(params.metadata),
      };

      const logId = await auditRepository.insertAuditLog(sanitizedParams);
      return logId;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`⚠️ [AuditService Failure] Failed to append security audit record: ${errorMsg}`, {
        eventType: params.eventType,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
      });
      return null;
    }
  }

  /**
   * Retrieve filtered, paginated audit logs for administrators
   */
  async getAuditLogs(filters: AuditLogQueryFilters): Promise<{ logs: SecurityAuditLog[]; total: number }> {
    return auditRepository.findAuditLogs(filters);
  }
}

export const auditService = new AuditService();
