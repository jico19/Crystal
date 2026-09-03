# Task 03: List Client Authorizations Express Route
**Spec:** `06-client-authorization-management` | **Phase:** 2-API | **Task:** 03

## Prerequisites
- [x] Task 01: `client_authorizations` table exists

## Context
Staff and coordinators fetch active, expiring, or exhausted prior authorizations for a specific client or across the state agency roster to track unit utilization and renewal deadlines.

## Stack & Files
- **Layer:** Express API
- **Modify:** `apps/api/src/modules/authorizations/authorization.router.ts` — mount `GET /`
- **Modify:** `apps/api/src/modules/authorizations/authorization.controller.ts`

## Deliverable
An Express route `GET /api/v1/authorizations?clientId=&status=` returning an array of authorizations matching the requested filters, scoped to the user's authenticated `org_id`.

## Inputs
- Query parameters: `clientId` (optional UUID), `status` (optional `auth_status_type`), `page`, `limit`

## Outputs
- `200 OK`: `{ success: true, data: { authorizations: Authorization[], total: number } }`

## Acceptance Criteria
- [ ] Filters by `clientId` if query parameter is provided
- [ ] Filters by `status` if provided
- [ ] Enforces tenant boundary using `req.user.org_id`
- [ ] Orders results by `end_date ASC` (expiring soonest first)

## Do NOT
- Do not return authorizations belonging to other state organizations
