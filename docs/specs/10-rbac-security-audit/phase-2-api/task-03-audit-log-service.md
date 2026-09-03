# Task 03: Security Audit Log Internal Service
**Spec:** `10-rbac-security-audit` | **Phase:** 2-API | **Task:** 03

## Prerequisites
- [x] Task 01: `security_audit_logs` table exists

## Context
Provides an internal audit service used across all backend modules (`auth`, `caregivers`, `clients`, `documents`) to append immutable security audit entries whenever PHI is inspected, documents downloaded, or credentials mutated.

## Stack & Files
- **Layer:** Express API Service
- **Create:** `apps/api/src/modules/audit/audit.service.ts`
- **Create:** `apps/api/src/modules/audit/audit.types.ts`

## Deliverable
A domain service function `logAuditEvent(eventData)` that captures actor `user_id`, `org_id`, `event_type`, `resource_type`, `resource_id`, `ip_address`, `user_agent`, and metadata payload into `security_audit_logs`.

## Inputs
- Event payload:
```typescript
{
  userId?: string;
  orgId?: string;
  eventType: 'AUTH_LOGIN' | 'PHI_ACCESS' | 'PII_DECRYPT' | 'DOCUMENT_DOWNLOAD' | 'ROLE_CHANGE';
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}
```

## Outputs
- Inserted `security_audit_logs` record ID

## Acceptance Criteria
- [ ] Strips any raw PII/PHI from `metadata` before persisting to log DB
- [ ] Operates asynchronously without blocking main HTTP request/response loop
- [ ] Captures client IP address from `x-forwarded-for` or socket connection

## Do NOT
- Do not expose an unauthenticated public route for inserting audit logs
- Do not log sensitive unencrypted SSNs, passwords, or patient medical details into metadata JSONB
