# Task 07: HIPAA Audit Log Viewer Component
**Spec:** `10-rbac-security-audit` | **Phase:** 3-Frontend | **Task:** 07

## Prerequisites
- [x] Task 04: `GET /api/v1/audit/logs` Express route exists

## Context
Super administrators view the security audit log search table to review HIPAA compliance events, system authentication logs, document download records, and PII access events.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/components/admin/AuditLogViewer.tsx`

## Deliverable
A searchable audit log table component (`AuditLogViewer.tsx`) rendering event timestamps, actor names, event types (`PHI_ACCESS`, `DOCUMENT_DOWNLOAD`, `AUTH_LOGIN`), target resource IDs, IP addresses, and metadata inspector drawer.

## Inputs
- Search query, Event type filter, Date range filter, Page number
- API Endpoint: `GET /api/v1/audit/logs`

## Outputs
- Paginated table UI with metadata inspection drawer

## Acceptance Criteria
- [ ] Displays event logs ordered by timestamp DESC
- [ ] Event type filter dropdown filters log entries
- [ ] Clicking a log row opens metadata side drawer showing JSON metadata
- [ ] Shows warning badge on `AUTH_LOCKOUT` and `SECURITY_VIOLATION` events

## Do NOT
- Do not render unformatted JSON inline in table cells — use side drawer for detailed metadata
