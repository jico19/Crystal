# Task 02: Create `POST /api/v1/clients/intake` Express route

**Spec:** `05-client-intake-documents` | **Phase:** 2-API | **Task:** 02

## Prerequisites
- Task 01 complete: `clients` table and enums exist in the database.
- `verifyJWT` middleware exists at `apps/api/src/middleware/verifyJWT.ts`.
- `requireRole` middleware exists at `apps/api/src/middleware/requireRole.ts`.
- `@crystal/validation` package has `ClientIntakeFormSchema` exported (or you will define it here in `module.schema.ts`).
- Database client available at `apps/api/src/db/`.

## Context
This task delivers the Express route that accepts a full client intake submission from coordinators and administrators. The Vite React frontend (`apps/georgia/` or `apps/indiana/`) will call this endpoint. The service layer must enforce the conditional `medicaid_id` rule and detect duplicate clients by `(org_id, first_name, last_name, dob)` before inserting, returning a 409 if a duplicate is found.

## Stack & Files
- **Layer:** Express API
- **Create:** `apps/api/src/modules/clients/clients.router.ts` — mounts POST `/intake` route with `verifyJWT` + `requireRole(['admin','coordinator'])`
- **Create:** `apps/api/src/modules/clients/clients.controller.ts` — `createClientIntake` handler: parse body, call service, return response
- **Create:** `apps/api/src/modules/clients/clients.service.ts` — `createClientIntake`: Zod validation, duplicate check, DB insert
- **Create:** `apps/api/src/modules/clients/clients.repository.ts` — `findDuplicate(orgId, firstName, lastName, dob)`, `insertClient(data)`
- **Create:** `apps/api/src/modules/clients/clients.schema.ts` — Zod schema `ClientIntakeFormSchema` (or re-export from `@crystal/validation`)
- **Modify:** `apps/api/src/app.ts` — mount `clientsRouter` at `/api/v1/clients`

## Deliverable
An Express route `POST /api/v1/clients/intake` that validates input with `ClientIntakeFormSchema`, checks for duplicates, inserts a row into `clients` with `status = 'intake_pending'`, and returns `{ success: true, data: { clientId, status } }` with HTTP 201.

## Inputs
Request body — `ClientIntakeFormSchema`:
```typescript
{
  org_id: string;            // UUID
  state_code: 'GA' | 'IN' | 'FL';
  first_name: string;        // min 2
  last_name: string;         // min 2
  dob: string;               // YYYY-MM-DD
  gender?: string;
  primary_phone: string;     // US phone
  service_address: {
    street: string;
    city: string;
    state: string;           // 2-char
    zip: string;             // \d{5}(-\d{4})?
    gate_code?: string;
  };
  primary_payer: 'medicaid_waiver' | 'private_pay' | 'va_community_care' | 'long_term_care_insurance' | 'commercial_insurance';
  medicaid_id?: string;      // required when primary_payer = 'medicaid_waiver'
  emergency_contacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    is_primary: boolean;
    has_poa: boolean;
  }>;                        // min length 1
}
```

JWT payload (from `verifyJWT` middleware): `{ sub: string, app_metadata: { org_id: string, role: string } }`

## Outputs
**HTTP 201 — Success:**
```json
{ "success": true, "data": { "clientId": "uuid", "status": "intake_pending" } }
```

**HTTP 400 — Validation failure:**
```json
{ "success": false, "error": "Validation failed", "fieldErrors": { "medicaid_id": ["Required when payer is Medicaid"] } }
```

**HTTP 401 — No / invalid JWT:**
```json
{ "success": false, "error": "Unauthorized" }
```

**HTTP 403 — Insufficient role:**
```json
{ "success": false, "error": "Forbidden" }
```

**HTTP 409 — Duplicate client:**
```json
{ "success": false, "error": "A client with this name and DOB already exists", "data": { "existingClientId": "uuid" } }
```

**HTTP 500 — DB error:**
```json
{ "success": false, "error": "Internal server error" }
```

## Acceptance Criteria
- [ ] `POST /api/v1/clients/intake` with valid body returns HTTP 201 and the new `clientId`; the DB row has `status = 'intake_pending'`.
- [ ] Submitting `primary_payer = 'medicaid_waiver'` without `medicaid_id` returns HTTP 400 with a field error on `medicaid_id`.
- [ ] Submitting a duplicate `(org_id, first_name, last_name, dob)` returns HTTP 409 with the existing client's ID.
- [ ] Unauthenticated request returns HTTP 401; caregiver-role request returns HTTP 403.
- [ ] The inserted row's `org_id` is sourced from the validated request body and must match the JWT's `app_metadata.org_id` (service throws 403 if mismatch).

## Do NOT
- Do not implement `GET`, `PUT`, or `DELETE` routes in this task — those are tasks 03–05.
- Do not read `org_id` exclusively from the JWT; accept it from the body but validate it matches the JWT org_id.
- Do not write any frontend code.
- Do not call Supabase directly from the route handler — all DB access goes through the repository.
