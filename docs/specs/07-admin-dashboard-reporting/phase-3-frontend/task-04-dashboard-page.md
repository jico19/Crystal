# Task 04: Admin Dashboard Page & State Filter Header
**Spec:** `07-admin-dashboard-reporting` | **Phase:** 3-Frontend | **Task:** 04

## Prerequisites
- [x] Task 02: `GET /api/v1/reports/kpis` API route exists

## Context
Executive leadership and state directors land on the Admin Dashboard to review state-wide operational health. Super admins can toggle between `All States`, `Georgia (With Open Hands)`, and `Indiana (Cherish Open Arms)`.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/pages/admin/dashboard/AdminDashboardPage.tsx`
- **Create:** `apps/georgia/src/components/admin/StateFilterTabs.tsx`

## Deliverable
A dashboard page shell (`AdminDashboardPage.tsx`) with state filter header tabs (`All`, `Georgia`, `Indiana`), state management for active state selection, and container grid layout for KPI cards and action queues.

## Inputs
- User context (`req.user.role`, `req.user.org_id`)
- Selected state filter state (`'ALL' | 'GA' | 'IN'`)

## Outputs
- Rendered page shell with state switcher header

## Acceptance Criteria
- [ ] Single-state coordinators have state switcher disabled (fixed to their assigned state)
- [ ] Super admins can toggle between `All States`, `Georgia`, and `Indiana`
- [ ] Changing state filter updates active state parameter passed to child components

## Do NOT
- Do not hardcode state lists — rely on organization state codes ('GA', 'IN', 'FL')
