# Task 07: Client Roster Page & Filtering
**Spec:** `05-client-intake-documents` | **Phase:** 3-Frontend | **Task:** 07

## Prerequisites
- [x] Task 03: `GET /api/v1/clients` Express route exists

## Context
Staff and coordinators view the master client roster to monitor prospective, active, and discharged clients across their state agency. The page provides status filters (`inquiry`, `intake_pending`, `assessment_scheduled`, `active`, `discharged`), state toggles, and search functionality.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/pages/admin/clients/ClientRosterPage.tsx` (re-used/imported in Indiana SPA)
- **Create:** `apps/georgia/src/components/clients/ClientRosterTable.tsx`
- **Create:** `apps/georgia/src/hooks/useClients.ts` — TanStack Query wrapper calling `GET /api/v1/clients`

## Deliverable
A React client roster page component displaying a paginated table of clients with status badges, state filter tabs, search bar (by name or Medicaid ID), and a button to initiate a new intake (`/admin/clients/new`).

## Inputs
- Route parameters / Search params: `?status=&state=&search=&page=`
- API Response: `GET /api/v1/clients` $\rightarrow$ `{ success: true, data: { clients: Client[], total: number } }`

## Outputs
- Rendered table with columns: Client Name, DOB, Payer Type, Medicaid ID, Status Badge, Assigned RN, Actions (`View Profile`).

## Acceptance Criteria
- [ ] Displays loading skeleton state while fetching from `/api/v1/clients`
- [ ] Status filter dropdown filters roster by status
- [ ] Search input debounces user input (300ms) before querying API
- [ ] Status badges use color mapping (`active` = green, `intake_pending` = amber, `discharged` = gray)
- [ ] Clicking "New Client Intake" navigates to `/admin/clients/new`

## Do NOT
- Do not build the intake form modal/page in this task — that is Task 08
- Do not build the client 360 profile view in this task — that is Task 09
- Do not hardcode state codes — derive available state filters from logged-in user context
