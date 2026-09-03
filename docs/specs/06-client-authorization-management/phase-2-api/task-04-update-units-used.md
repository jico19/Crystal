# Task 04: Update Authorization Units Used Route
**Spec:** `06-client-authorization-management` | **Phase:** 2-API | **Task:** 04

## Prerequisites
- [x] Task 01: `client_authorizations` table exists

## Context
As caregiver shifts are logged or visits verified, unit consumption increments against the client's prior authorization. When `total_units_used >= total_units_authorized`, the system automatically updates authorization status to `exhausted`.

## Stack & Files
- **Layer:** Express API
- **Modify:** `apps/api/src/modules/authorizations/authorization.router.ts` — mount `PUT /:id/units`
- **Modify:** `apps/api/src/modules/authorizations/authorization.service.ts`

## Deliverable
An Express route `PUT /api/v1/authorizations/:id/units` that increments `total_units_used` by `additional_units`, recalculates status (`exhausted` if `total_units_used >= total_units_authorized`), and returns the updated authorization record.

## Inputs
- Route param: `id` (Authorization UUID)
- Body: `{ additional_units: number }` (positive numeric, e.g. 4.00 for 1 hour of care)

## Outputs
- `200 OK`: `{ success: true, data: Authorization }`
- `400 Bad Request`: Invalid or non-positive additional units

## Acceptance Criteria
- [ ] Atomically increments `total_units_used` by `additional_units`
- [ ] Automatically transitions status to `'exhausted'` when `total_units_used >= total_units_authorized`
- [ ] Returns updated unit balance and remaining authorized units

## Do NOT
- Do not allow decrementing units to negative values
- Do not bypass status recalculation logic
