# Task 06: Authorization Roster Page & Burn-Down Dashboard
**Spec:** `06-client-authorization-management` | **Phase:** 3-Frontend | **Task:** 06

## Prerequisites
- [x] Task 03: `GET /api/v1/authorizations` API route exists

## Context
Agency directors and billing staff view the central prior authorization management dashboard to monitor active authorizations, unit burn-down rates, and expiring approvals requiring renewal submissions.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/pages/admin/authorizations/AuthorizationRosterPage.tsx`
- **Create:** `apps/georgia/src/hooks/useAuthorizations.ts`

## Deliverable
A React authorization management page displaying a filterable roster of authorizations, status tabs (`All`, `Active`, `Expiring Soon`, `Exhausted`), summary metrics (Total Active, Expiring <30 Days), and a "New Authorization" trigger button.

## Inputs
- Route parameters / Query state: `?status=&clientId=`
- Data fetched from `GET /api/v1/authorizations`

## Outputs
- Rendered list of `AuthorizationCard` components (Task 07)

## Acceptance Criteria
- [ ] Displays loading skeleton while fetching data
- [ ] Status tabs filter displayed authorizations
- [ ] Metric cards show count of active, expiring soon, and exhausted authorizations
- [ ] "New Authorization" button opens creation modal (Task 08)

## Do NOT
- Do not hardcode unit thresholds — calculate progress dynamically from `total_units_used` / `total_units_authorized`
