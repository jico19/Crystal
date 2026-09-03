# Task 05: Executive Metric KPI Card Grid
**Spec:** `07-admin-dashboard-reporting` | **Phase:** 3-Frontend | **Task:** 05

## Prerequisites
- [x] Task 02: `GET /api/v1/reports/kpis` Express route exists
- [x] `@crystal/types` exports `AdminKpiResponse`

## Context
Displays top-level operational KPIs: Active Caregivers, Compliance %, Pending Onboarding Applications, Active Clients, and Expiring Authorizations.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/components/admin/MetricCardGrid.tsx`
- **Create:** `apps/georgia/src/hooks/useAdminMetrics.ts`

## Deliverable
A responsive 5-card grid component (`MetricCardGrid.tsx`) fetching data from `GET /api/v1/reports/kpis?state=` and displaying active caregiver counts, compliance percentage badge, pending applications, active client roster size, and expiring authorization alerts.

## Inputs
- Props: `{ selectedState: 'ALL' | 'GA' | 'IN' }`
- API Endpoint: `GET /api/v1/reports/kpis?state=`

## Outputs
- Rendered 5-card grid with loading skeleton states and real-time metric numbers

## Acceptance Criteria
- [ ] Displays loading state while metrics request is pending
- [ ] Refreshes metrics automatically when `selectedState` prop changes
- [ ] Card 1: Active Caregivers count
- [ ] Card 2: Pending Applications count (with amber alert badge if > 5)
- [ ] Card 3: Pending Document Reviews count
- [ ] Card 4: Active Client Roster count
- [ ] Card 5: Expiring Authorizations count (with red alert badge if > 0)

## Do NOT
- Do not make separate DB calls from frontend — single `/api/v1/reports/kpis` endpoint supplies all card values
