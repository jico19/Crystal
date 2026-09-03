# Task 04: Get Audit Logs Express Route
**Spec:** `10-rbac-security-audit` | **Phase:** 2-API | **Task:** 04

## Prerequisites
- [x] Task 01: `security_audit_logs` table exists
- [x] Task 02: `requireRole` middleware exists

## Context
Super administrators query the security audit logs to inspect HIPAA access history, security violations, authentication events, and document download records.

## Stack & Files
- **Layer:** Express API Route
- **Create:** `apps/api/src/modules/audit/audit.router.ts` — mount `GET /logs`
- **Create:** `apps/api/src/modules/audit/audit.controller.ts`

## Deliverable
An Express route `GET /api/v1/audit/logs` guarded by `requireRole('super_admin')` returning paginated audit logs with optional filters for `eventType`, `orgId`, `startDate`, `endDate`, and `userId`.

## Inputs
- Query parameters: `eventType`, `orgId`, `startDate`, `endDate`, `page`, `limit`

## Outputs
- `200 OK`: `{ success: true, data: { logs: AuditLog[], total: number } }`
- `403 Forbidden`: Non-super_admin user

## Acceptance Criteria
- [ ] Strictly restricts endpoint access to `super_admin` role
- [ ] Returns paginated log entries ordered by `created_at DESC`
- [ ] Filters by `eventType`, `orgId`, and date range if provided
- [ ] Limits max page size to 100 entries

## Do NOT
- Do not allow agency admins or coordinators to query audit logs across other organizations
