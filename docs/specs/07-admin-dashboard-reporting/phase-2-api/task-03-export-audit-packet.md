# Task 03: `GET /api/v1/reports/export` — Compliance Audit Export Route

**Spec:** `07-admin-dashboard-reporting` | **Phase:** 2-API | **Task:** 03

## Prerequisites
- Task 01: `public.view_admin_state_kpis` VIEW must exist.
- Task 02: `reports.router.ts` and `reports.service.ts` must exist (add the export handler to the same module).
- `apps/api/src/middleware/verifyJWT.ts` and `requireRole.ts` must exist.
- `apps/api/src/db/index.ts` must export a `db` query helper.
- npm package `json2csv` (or equivalent) must be available for CSV serialization.

## Context
State surveyors require periodic compliance audit packets containing caregiver records, their document verification statuses, active clients, and authorization summaries — all scoped to a single state. This route queries the underlying tables (not just the summary VIEW), serializes the result, and **streams** the file response so large data sets do not buffer in memory. PDF generation is out of scope for the initial delivery; a well-structured CSV satisfies the requirement.

## Stack & Files
- **Layer:** Express API
- **Modify:** `apps/api/src/modules/reports/reports.controller.ts` — add `exportAuditPacket` handler
- **Modify:** `apps/api/src/modules/reports/reports.service.ts` — add `buildAuditDataset(state, orgId)` query
- **Modify:** `apps/api/src/modules/reports/reports.schema.ts` — add `ExportQuerySchema` Zod schema
- **Modify:** `apps/api/src/modules/reports/reports.router.ts` — wire `GET /export` to handler

## Deliverable
An Express route `GET /api/v1/reports/export?state=GA|IN&format=csv` that queries caregiver, document, client, and authorization tables for the requested state, serializes the data as CSV, and streams it as a file download with correct `Content-Disposition` and `Content-Type` headers.

## Inputs

Query parameter schema (`ExportQuerySchema`):
```typescript
{
  state: 'GA' | 'IN';       // required, no ALL — export must be single-state
  format: 'csv';             // 'pdf' reserved for future spec; only 'csv' for now
}
```

## Outputs

**200 OK — CSV stream:**
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="audit_GA_2026-09-03.csv"` (filename includes state + ISO date)
- Body: CSV rows with columns: `caregiver_id`, `full_name`, `application_status`, `document_type`, `verification_status`, `client_id`, `client_name`, `authorization_status`, `authorized_units`, `rendered_units`

**400 Bad Request — missing or invalid params:**
```typescript
{ success: false, error: 'Validation error', details: ZodIssue[] }
```

**401 Unauthorized / 403 Forbidden** — same shapes as Task 02.

## Acceptance Criteria
- [ ] `GET /api/v1/reports/export?state=GA&format=csv` with a valid `super_admin` JWT responds with `Content-Type: text/csv` and begins streaming immediately.
- [ ] The `Content-Disposition` filename contains `GA` and the current UTC date in `YYYY-MM-DD` format.
- [ ] Omitting `state` returns `400`.
- [ ] Passing `state=ALL` returns `400` (single-state only for exports).
- [ ] An `agency_admin` for Georgia requesting `state=IN` returns `403`.

## Do NOT
- Do not implement PDF generation in this task — only CSV.
- Do not buffer the entire dataset into a string before responding — use streaming or pipe a readable stream to `res`.
- Do not expose this route to `coordinator` or `caregiver` roles.
- Do not add new columns beyond the specified CSV schema without updating the Zod output type.
