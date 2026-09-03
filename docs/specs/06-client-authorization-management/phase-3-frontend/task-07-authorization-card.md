# Task 07: Authorization Card & Unit Progress Meter
**Spec:** `06-client-authorization-management` | **Phase:** 3-Frontend | **Task:** 07

## Prerequisites
- [x] Task 01: `Authorization` interface defined in `@crystal/types`

## Context
Each prior authorization record renders a visual card featuring procedure codes, payer details, authorized dates, and a progress bar showing percentage of units consumed vs timeline elapsed.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/components/authorizations/AuthorizationCard.tsx`
- **Create:** `apps/georgia/src/components/authorizations/ExpirationBadge.tsx`

## Deliverable
A reusable `AuthorizationCard` component displaying procedure code (e.g. `T1019`), authorization number, date range, unit burn-down progress bar, and expiration badge (`Red` for <30 days, `Amber` for 30-60 days, `Green` for >60 days).

## Inputs
- Props: `{ authorization: Authorization, onLogUnits?: () => void, onRenew?: () => void }`

## Outputs
- Rendered card UI with progress bar and color-coded status badge

## Acceptance Criteria
- [ ] Progress bar percentage calculated as `(total_units_used / total_units_authorized) * 100`
- [ ] Expiration badge displays days remaining until `end_date`
- [ ] Shows warning icon if percentage of units consumed exceeds percentage of timeline elapsed
- [ ] Formats procedure code and payer name cleanly

## Do NOT
- Do not allow raw unstyled html bars — use shadcn/ui Progress component
