# Spec 10: Role-Based Access Control (RBAC), Security & HIPAA Compliance

## Goal

Establish a zero-trust, HIPAA-compliant security architecture enforcing granular Role-Based Access Control (RBAC), multi-tenant Row-Level Security (RLS), field-level PII encryption, time-limited presigned media tokens, and immutable audit trails across all state agencies.

## Problem Statement

Handling Protected Health Information (PHI) and caregiver PII (SSNs, background reports, medical exams) requires airtight security. Without strict database-level RLS and audit trails, improper cross-tenant data access or unauthorized record inspections could trigger severe HIPAA OCR violation fines.

## Scope Boundaries

### In-Scope
- 5 System Roles: `super_admin`, `agency_admin`, `care_coordinator`, `registered_nurse`, `caregiver`.
- Multi-tenant tenant boundary isolation (Georgia vs. Indiana vs. Florida).
- AES-256 / AWS KMS encryption at rest and TLS 1.3 in transit.
- Comprehensive immutable audit logging table for all PHI/PII queries.
- Account lockout after 5 consecutive failed login attempts within 15 minutes.

### Out-of-Scope
- Hardware biometric physical security access.
- Field-level PII encryption implementation (KMS key rotation handled by infrastructure).
- MFA enrollment flows (tracked by `mfa_enabled` column; enrollment UI is a separate spec).

---

## Architecture Overview

```
Frontend (Vite SPA)
  └── calls fetch('/api/v1/...')  with Bearer token
        └── Express API Middleware Chain:
              verifyJWT → requireRole → requireOrg → controller
                └── controller calls audit.service.logAuditEvent(...)
                      └── PostgreSQL:
                            user_profiles       (roles)
                            security_audit_logs (immutable trail)
```

- **`verifyJWT`** — decodes and verifies the Bearer token; attaches `req.user` (`{ id, role, org_id }`).
- **`requireRole(allowedRoles[])`** — rejects with 403 if `req.user.role` not in the allowed list. `super_admin` always passes.
- **`requireOrg`** — rejects with 400 if `req.user.org_id` is missing (prevents super_admin-only tokens from hitting org-scoped routes by accident).

---

## Role Permission Matrix

| Role | Permissions |
| :--- | :--- |
| `super_admin` | All resources, all states, all orgs |
| `agency_admin` | Read all within state, write caregivers + clients + reports for state |
| `care_coordinator` | Read/write caregivers + clients + intakes within state |
| `registered_nurse` | Read assigned clients, write clinical assessments |
| `caregiver` | Read/write own profile, read assigned training |

---

## Data Model Summary

### `user_profiles`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | PK, FK → `auth.users.id` |
| `org_id` | UUID | FK → `organizations.id` |
| `role` | `user_role_type` enum | See roles above |
| `state_code` | VARCHAR(2) | `GA`, `IN`, `FL`, `ALL` |
| `is_active` | BOOLEAN | Soft lock flag |
| `mfa_enabled` | BOOLEAN | Informational; enforcement is JWT-level |

### `security_audit_logs`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `user_id` | UUID | FK → `auth.users.id` (nullable on delete) |
| `org_id` | UUID | FK → `organizations.id` (nullable on delete) |
| `event_type` | VARCHAR | `AUTH_LOGIN`, `AUTH_FAILED`, `AUTH_LOCKOUT`, `PHI_ACCESS`, `PII_DECRYPT`, `RECORD_MUTATION`, `SECURITY_VIOLATION` |
| `resource_type` | VARCHAR | `caregiver_profiles`, `clients`, `caregiver_documents`, etc. |
| `resource_id` | UUID | The affected record (nullable) |
| `metadata` | JSONB | Free-form context (request path, HTTP method, diff) |
| `created_at` | TIMESTAMPTZ | Insert-only; never updated |

> **Immutability rule:** No UPDATE or DELETE is permitted on `security_audit_logs`. Only INSERT via the backend service role. The RLS policy enforces this.

---

## Validation Schemas (`@crystal/validation`)

> Full Zod schema definitions belong in `packages/validation/src/rbac.schema.ts`. Tasks reference these by name only.

- **`UserRoleSchema`** — `z.enum(['super_admin', 'agency_admin', 'care_coordinator', 'registered_nurse', 'caregiver'])`.
- **`AuditLogQuerySchema`** — `event_type` (optional enum), `org_id` (optional uuid), `from_date` / `to_date` (ISO datetime strings), `page` + `page_size` (integers).

---

## Edge Cases & Failure Recovery Matrix

| Failure Scenario | Root Cause | System Response & Mitigation |
| :--- | :--- | :--- |
| **Token Tampering / Role Injection** | Malicious client alters JWT payload | `verifyJWT` middleware verifies cryptographic signature against `JWT_SECRET`; invalid JWT rejected with HTTP 401 before any business logic runs. |
| **Cross-State Record Access** | Staff queries URL with out-of-state resource ID | PostgreSQL RLS evaluates `org_id` match and returns 0 rows; API returns HTTP 404 to avoid confirming resource existence. |
| **Account Lockout Race Condition** | Two concurrent requests both detect 5th failed attempt | Cron job uses a DB transaction with `SELECT FOR UPDATE` on the user row to serialize the lockout write. |
| **Audit Log Write Failure** | DB unavailable during PHI access | API responds to the original request; audit log write is retried asynchronously. The operation is NOT blocked — availability > perfect audit completeness. |
| **Super Admin Viewing Wrong Tenant** | `super_admin` has no `org_id` in JWT | `requireOrg` middleware is NOT applied to `super_admin` routes; `GET /audit/logs` uses explicit `org_id` query param instead. |

---

## Acceptance Tests (Gherkin)

```gherkin
Feature: RBAC & Security Boundaries

  Scenario: Caregiver attempts accessing client medical records
    Given a logged in user with role "caregiver"
    When the user sends a GET request to "/api/v1/clients"
    Then the system returns HTTP status 403 Forbidden
    And a "SECURITY_VIOLATION" entry is recorded in the audit log

  Scenario: Agency coordinator cannot view out-of-state caregiver records
    Given a coordinator assigned to Georgia ("With Open Hands")
    When querying caregiver profiles
    Then only records tagged with Georgia org_id are returned
    And Indiana records are completely omitted by RLS

  Scenario: Account locked after 5 consecutive failed logins
    Given a user who has failed login 4 times in the last 15 minutes
    When they attempt to login and fail a 5th time
    Then the cron job detects 5 consecutive AUTH_FAILED events within 15 minutes
    And sets user_profiles.is_active = false for that user
    And inserts an AUTH_LOCKOUT event into security_audit_logs

  Scenario: Super admin reads paginated audit log
    Given an authenticated super_admin user
    When they GET /api/v1/audit/logs?event_type=PHI_ACCESS&page=1&page_size=25
    Then the response contains { data: [...], pagination: { total, page, page_size } }
    And all returned entries have event_type = "PHI_ACCESS"

  Scenario: Invalid JWT is rejected
    Given a request with a tampered or expired Bearer token
    When any protected endpoint is called
    Then the API returns HTTP 401 Unauthorized
    And no database query is executed
```

---

## Task Breakdown

| Task | Phase | File | Deliverable |
| :--- | :--- | :--- | :--- |
| 01 | Database | `phase-1-database/task-01-user-profiles-schema.md` | `user_profiles` + `user_role_type` enum + RLS + `security_audit_logs` |
| 02 | API | `phase-2-api/task-02-auth-middleware.md` | `verifyJWT`, `requireRole`, `requireOrg` middleware |
| 03 | API | `phase-2-api/task-03-audit-log-service.md` | `audit.service.ts` with `logAuditEvent()` |
| 04 | API | `phase-2-api/task-04-get-audit-logs.md` | `GET /api/v1/audit/logs` |
| 05 | API | `phase-2-api/task-05-account-lockout-cron.md` | `node-cron` lockout job |
| 06 | Frontend | `phase-3-frontend/task-06-role-assignment-table.md` | `UserRoleAssignmentTable.tsx` |
| 07 | Frontend | `phase-3-frontend/task-07-audit-log-viewer.md` | `AuditLogViewer.tsx` |
