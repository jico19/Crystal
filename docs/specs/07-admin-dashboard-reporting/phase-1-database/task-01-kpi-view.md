# Task 01: Create `view_admin_state_kpis` SQL VIEW

**Spec:** `07-admin-dashboard-reporting` | **Phase:** 1-Database | **Task:** 01

## Prerequisites
The following tables must already exist (created in earlier specs):
- `public.organizations` — Spec 01
- `public.caregiver_profiles` with column `application_status VARCHAR` — Spec 02
- `public.caregiver_documents` with column `verification_status VARCHAR` — Spec 03
- `public.clients` with column `status VARCHAR` — Spec 05
- `public.client_authorizations` with column `status VARCHAR` — Spec 06

All tables must have an `org_id UUID` foreign key referencing `public.organizations(id)`.

## Context
The admin dashboard needs a single aggregated data source per organization that counts caregivers, pending documents, active clients, and expiring authorizations. This VIEW collates those counts so the API layer can query one object instead of running five separate queries. It is a standard (non-materialized) VIEW because counts must always reflect the live state; hourly refresh lag is unacceptable for a real-time dashboard.

## Stack & Files
- **Layer:** Database Migration
- **Create:** `db_schema/migrations/0014_create_view_admin_state_kpis.sql` — SQL VIEW definition

## Deliverable
A SQL migration file that creates `public.view_admin_state_kpis`, aggregating five KPI counts per organization row, using `COUNT(DISTINCT ...) FILTER (WHERE ...)` to avoid cross-join inflation.

## Inputs
No runtime inputs — this is a DDL object, not a parameterized query.

## Outputs
Each row of the VIEW exposes:

```typescript
{
  org_id: string;               // UUID
  state_code: 'GA' | 'IN';
  organization_name: string;
  active_caregivers_count: number;
  pending_applications_count: number;
  pending_document_reviews_count: number;
  active_clients_count: number;
  expiring_authorizations_count: number;
}
```

## Acceptance Criteria
- [ ] `SELECT * FROM public.view_admin_state_kpis;` returns one row per organization with all five numeric columns populated (never null — use `COALESCE` or `COUNT` which returns 0 naturally).
- [ ] Filtering `WHERE state_code = 'GA'` returns only Georgia org rows.
- [ ] Inserting a caregiver with `application_status = 'approved'` increments `active_caregivers_count` by 1 when the VIEW is re-queried.
- [ ] The migration runs idempotently: `CREATE OR REPLACE VIEW` does not error if the VIEW already exists.
- [ ] `ALTER VIEW public.view_admin_state_kpis OWNER TO postgres;` is included at the end of the migration.

## Do NOT
- Do not create a MATERIALIZED VIEW — this task is a plain VIEW that reflects live data.
- Do not add any application logic (no triggers, no functions) — only the VIEW DDL.
- Do not modify any of the source tables referenced in the JOIN.
- Do not add RLS to the VIEW itself — access control is enforced in the API middleware layer.
