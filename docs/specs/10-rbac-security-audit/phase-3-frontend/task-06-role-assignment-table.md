# Task 06: Staff Role Assignment Administration Table
**Spec:** `10-rbac-security-audit` | **Phase:** 3-Frontend | **Task:** 06

## Prerequisites
- [x] Task 01: `user_profiles` table exists
- [x] Task 02: `requireRole` middleware exists

## Context
Super admins and agency directors use this administration panel to view staff members, toggle user roles (`agency_admin`, `care_coordinator`, `registered_nurse`, `caregiver`), assign state territory boundaries (`GA`, `IN`, `FL`), and enable/disable account access.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/pages/admin/settings/RbacAdminPage.tsx`
- **Create:** `apps/georgia/src/components/admin/UserRoleAssignmentTable.tsx`

## Deliverable
A staff management component (`UserRoleAssignmentTable.tsx`) rendering a table of staff profiles, role selector dropdowns, state territory badges, and an account active toggle switch.

## Inputs
- Staff list fetched from `GET /api/v1/users`

## Outputs
- Role update API call: `PUT /api/v1/users/:id/role`

## Acceptance Criteria
- [ ] Displays table of staff with name, email, role badge, assigned state, and status
- [ ] Changing role dropdown triggers confirmation modal before making API request
- [ ] Toggle switch enables/disables staff account access
- [ ] Only accessible by `super_admin` or `agency_admin` roles

## Do NOT
- Do not allow agency admins to promote themselves or others to `super_admin`
