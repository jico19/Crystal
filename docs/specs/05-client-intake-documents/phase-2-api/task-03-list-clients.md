# Task 03: Create `GET /api/v1/clients` paginated list route

**Spec:** `05-client-intake-documents` | **Phase:** 2-API | **Task:** 03

## Prerequisites
- Task 01 complete: `clients` table exists with `idx_clients_org_status` index.
- Task 02 complete: `clients.router.ts`, `clients.controller.ts`, `clients.service.ts`, `clients.repository.ts` files exist.
- `verifyJWT` and `requireRole` middleware exist.

## Context
Coordinators and administrators need a paginated, filterable list of clients scoped strictly to their organisation. This route extends the existing clients module files created in task 02. The frontend roster page (task 07) will call this endpoint to populate its table with filter tabs by state and status.

## Stack & Files
- **Layer:** Express API
- **Modify:** `apps/api/src/modules/clients/clients.router.ts` — add `GET /` route with `verifyJWT` + `requireRole(['admin','coordinator'])`
- **Modify:** `apps/api/src/modules/clients/clients.controller.ts` — add `listClients` handler
- **Modify:** `apps/api/src/modules/clients/clients.service.ts` — add `listClients(orgId, filters, pagination)` function
- **Modify:** `apps/api/src/modules/clients/clients.repository.ts` — add `findClientsByOrg(orgId, filters, limit, offset)` and `countClientsByOrg(orgId, filters)` functions

## Deliverable
An Express route `GET /api/v1/clients` that reads `org_id` from JWT, accepts optional query parameters `status`, `state_code`, `page`, and `limit`, queries the `clients` table, and returns a paginated list with total count metadata — accessible only by `admin` and `coordinator` roles.

## Inputs
Query parameters:
```typescript
{
  status?: 'inquiry' | 'intake_pending' | 'assessment_scheduled' | 'active' | 'on_hold' | 'discharged';
  state_code?: 'GA' | 'IN' | 'FL';
  page?: number;   // default 1
  limit?: number;  // default 25, max 100
}
```

JWT payload: `{ app_metadata: { org_id: string, role: string } }`

## Outputs
**HTTP 200 — Success:**
```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": "uuid",
        "first_name": "Robert",
        "last_name": "Smith",
        "dob": "1960-03-15",
        "status": "active",
        "state_code": "GA",
        "primary_phone": "555-123-4567",
        "primary_payer": "medicaid_waiver",
        "created_at": "2026-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 25,
      "totalPages": 2
    }
  }
}
```

**HTTP 401 / 403:** Standard error shape.

## Acceptance Criteria
- [ ] `GET /api/v1/clients` without filters returns all clients for the JWT's `org_id` only — no cross-org leakage.
- [ ] `?status=active&state_code=GA` filters results correctly; count reflects the filtered set.
- [ ] `?page=2&limit=10` returns the correct slice of results and `pagination.totalPages` is accurate.
- [ ] An `admin` or `coordinator` role succeeds; a `caregiver` role receives HTTP 403.
- [ ] Response list objects include only the summary fields listed above — full JSONB blobs (`care_needs`, `emergency_contacts`) are NOT included in list responses.

## Do NOT
- Do not return full JSONB fields (`care_needs`, `emergency_contacts`, `payer_details`) in the list response — those belong in task 04 (single profile).
- Do not implement sorting beyond created_at DESC (no user-specified sort in this task).
- Do not allow `limit` > 100; clamp or return a 400 if exceeded.
- Do not write any frontend code.
