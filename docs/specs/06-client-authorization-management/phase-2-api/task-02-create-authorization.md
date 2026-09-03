# Task 02: Create Client Authorization Express Route
**Spec:** `06-client-authorization-management` | **Phase:** 2-API | **Task:** 02

## Prerequisites
- [x] Task 01: `client_authorizations` table exists in PostgreSQL
- [x] `@crystal/validation` exports `ClientAuthorizationSchema`

## Context
Agency coordinators create prior authorization records when a Medicaid waiver or private payer issues an authorization approval notice. The API validates the date ranges and unit allocations before inserting into `client_authorizations`.

## Stack & Files
- **Layer:** Express API
- **Create:** `apps/api/src/modules/authorizations/authorization.router.ts`
- **Create:** `apps/api/src/modules/authorizations/authorization.controller.ts`
- **Create:** `apps/api/src/modules/authorizations/authorization.service.ts`

## Deliverable
An Express route `POST /api/v1/authorizations` that validates payload with `ClientAuthorizationSchema`, verifies staff permissions for the client's `org_id`, inserts the authorization row, and returns `{ success: true, data: Authorization }`.

## Inputs
- Request body validated via `ClientAuthorizationSchema`:
```typescript
{
  client_id: string; // UUID
  payer_name: string;
  authorization_number: string;
  procedure_code: string; // e.g. "T1019", "S5125"
  service_type: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD (must be > start_date)
  total_units_authorized: number;
  weekly_hours_cap?: number;
  notes?: string;
}
```

## Outputs
- `201 Created`: `{ success: true, data: Authorization }`
- `400 Bad Request`: Validation failure (e.g. end_date <= start_date)
- `401 Unauthorized`: Invalid JWT
- `403 Forbidden`: User org_id mismatch

## Acceptance Criteria
- [ ] Validates `end_date` is strictly after `start_date`
- [ ] Sets initial status to `'active'`
- [ ] Sources `org_id` from authenticated `req.user.org_id`
- [ ] Returns `201` with created authorization record on success

## Do NOT
- Do not accept client-supplied `org_id` overrides
- Do not allow negative authorized units
