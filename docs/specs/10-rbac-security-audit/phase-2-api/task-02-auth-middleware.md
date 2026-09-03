# Task 02: Express Authentication & RBAC Middleware
**Spec:** `10-rbac-security-audit` | **Phase:** 2-API | **Task:** 02

## Prerequisites
- [x] Task 01: `user_profiles` schema defined

## Context
Provides the central Express.js middleware functions (`verifyJWT`, `requireRole`, `requireOrg`) that validate Bearer tokens, attach authenticated user state to `req.user`, enforce role permissions, and check organization tenant boundaries.

## Stack & Files
- **Layer:** Express API Middleware
- **Create:** `apps/api/src/middleware/verifyJWT.ts`
- **Create:** `apps/api/src/middleware/requireRole.ts`
- **Create:** `apps/api/src/middleware/requireOrg.ts`

## Deliverable
Three modular Express middleware functions:
1. `verifyJWT`: Validates JWT signature, attaches `req.user = { id, email, role, org_id }`
2. `requireRole(...roles)`: Verifies `req.user.role` is included in allowed list or is `super_admin`
3. `requireOrg`: Ensures `req.user.org_id` is present

## Inputs
- Express `Request` object with `Authorization: Bearer <token>` header

## Outputs
- Next middleware execution or HTTP `401 Unauthorized` / `403 Forbidden` response

## Acceptance Criteria
- [ ] `verifyJWT` returns 401 if Authorization header is missing or JWT signature validation fails
- [ ] Decodes token and attaches `req.user` with type safety (`Express.Request` interface extended)
- [ ] `requireRole('super_admin', 'agency_admin')` returns 403 if user role is `caregiver`
- [ ] `super_admin` role automatically satisfies all role checks

## Do NOT
- Do not store plain secrets in code — use `process.env.JWT_SECRET`
- Do not rely on client-supplied headers for user identity
