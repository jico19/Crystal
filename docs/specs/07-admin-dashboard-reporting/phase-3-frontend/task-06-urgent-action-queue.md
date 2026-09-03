# Task 06: Urgent Action Queue Component
**Spec:** `07-admin-dashboard-reporting` | **Phase:** 3-Frontend | **Task:** 06

## Prerequisites
- [x] Spec 02 API routes exist
- [x] Spec 03 API routes exist
- [x] Spec 06 API routes exist

## Context
Staff members require an actionable work desk consolidated on the admin dashboard. The Action Queue features tabs for `Pending Documents`, `Submitted Applications`, and `Expiring Authorizations`, allowing instant 1-click navigation to review desks.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/components/admin/UrgentActionQueue.tsx`

## Deliverable
A tabbed work queue component (`UrgentActionQueue.tsx`) rendering urgent compliance tasks, application submissions, and authorization renewals requiring staff action.

## Inputs
- Props: `{ selectedState: 'ALL' | 'GA' | 'IN' }`

## Outputs
- Interactive tabbed list component with quick action links

## Acceptance Criteria
- [ ] Tab 1: Pending Document Reviews (links to `/admin/documents/review`)
- [ ] Tab 2: Caregiver Applications (links to `/admin/caregivers/applications`)
- [ ] Tab 3: Expiring Authorizations (links to `/admin/authorizations`)
- [ ] Badge counters show count of items pending in each queue tab

## Do NOT
- Do not build full review forms inside the queue card — cards redirect to focused workflow pages
