# Task 02: `GET /api/v1/reports/kpis` — Admin KPI Metrics Route

**Spec:** `07-admin-dashboard-reporting` | **Phase:** 2-API | **Task:** 02

## Prerequisites
- Task 01: `public.view_admin_state_kpis` VIEW must exist.
- `apps/api/src/middleware/verifyJWT.ts` must exist.
- `apps/api/src/middleware/requireRole.ts` must exist and accept role arrays.
- `apps/api/src/db/index.ts` must export a `db` query helper (pg or Drizzle).

## Context
The admin dashboard fetches aggregated KPIs via this Express route. The route queries `view_admin_state_kpis`, optionally filtered by `state_code`, and returns an array of KPI objects. Only `super_admin` and `agency_admin` roles may call this route — `agency_admin` users are further restricted to their own org's state by the middleware `requireOrg` which sets `req.user.org_id`.

## Stack & Files
- **Layer:** Express API
- **Create:** `apps/api/src/modules/reports/reports.router.ts` — mounts the KPI and export routes
- **Create:** `apps/api/src/modules/reports/reports.controller.ts` — request/response handling for KPI route
- **Create:** `apps/api/src/modules/reports/reports.service.ts` — queries the VIEW with optional state filter
- **Create:** `apps/api/src/modules/reports/reports.schema.ts` — Zod schema for query params and response
- **Modify:** `apps/api/src/index.ts` — mount `reportsRouter` at `/api/v1/reports`

## Deliverable
An Express route `GET /api/v1/reports/kpis?state=GA|IN|ALL` that queries `view_admin_state_kpis`, enforces role-based and org-based access, and returns a typed KPI array.

## Inputs

Query parameter schema (validated with Zod):
```typescript
{
  state?: 'GA' | 'IN' | 'ALL'   // default: 'ALL'
}
```

## Outputs

**200 OK — success:**
```typescript
{
  success: true,
  data: Array<{
    org_id: string;
    state_code: 'GA' | 'IN';
    organization_name: string;
    active_caregivers_count: number;
    pending_applications_count: number;
    pending_document_reviews_count: number;
    active_clients_count: number;
    expiring_authorizations_count: number;
  }>
}
```

**400 Bad Request — invalid `state` param:**
```typescript
{ success: false, error: 'Validation error', details: ZodIssue[] }
```

**401 Unauthorized — missing/invalid JWT:**
```typescript
{ success: false, error: 'Unauthorized' }
```

**403 Forbidden — role not permitted or cross-org access:**
```typescript
{ success: false, error: 'Forbidden' }
```

## Acceptance Criteria
- [ ] `GET /api/v1/reports/kpis` with a valid `super_admin` JWT and no `state` param returns data for all organizations.
- [ ] `GET /api/v1/reports/kpis?state=GA` returns only rows where `state_code = 'GA'`.
- [ ] `GET /api/v1/reports/kpis?state=IN` with an `agency_admin` JWT whose org is Georgia returns `403`.
- [ ] `GET /api/v1/reports/kpis?state=INVALID` returns `400` with a Zod validation error.
- [ ] An unauthenticated request (no `Authorization` header) returns `401`.

## Do NOT
- Do not write raw SQL inside the controller — all queries belong in `reports.service.ts`.
- Do not expose this route to `coordinator` or `caregiver` roles.
- Do not add the export endpoint to this task — that is Task 03.
- Do not create a materialized-view refresh endpoint here.
