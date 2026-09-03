# Spec 07: Admin Command Center & State Reporting

## Goal
Provide a centralized command center for executive leadership and state directors to monitor KPIs, caregiver compliance metrics, active client rosters, pending onboarding queues, and export state-ready regulatory compliance audit packets — across both Georgia (*With Open Hands*) and Indiana (*Cherish Open Arms*).

## Problem Statement
Executive leadership lacks a consolidated single-pane-of-glass dashboard across both states. Compiling audit reports for state surveyors currently takes days of manual file gathering.

## Scope

### In-Scope
- Executive Multi-State Overview with a state switcher toggle: **All States / GA / IN**.
- Five KPI widgets: Active Caregivers, Compliance %, Pending Applications, Active Clients, Expiring Authorizations.
- Actionable Work Queues: Document Review Queue, Application Review Queue, Expiring Authorizations.
- 1-Click State Audit Report exporter (CSV / PDF).

### Out-of-Scope
- Direct integration with QuickBooks / payroll ledger (a CSV export is sufficient).
- Real-time WebSocket streaming of KPI data (polling on page load is acceptable).

## Key Domain Concepts

| Term | Meaning |
|---|---|
| `state_code` | `'GA'` = With Open Hands, `'IN'` = Cherish Open Arms |
| `active_caregivers_count` | Caregivers with `application_status = 'approved'` |
| `pending_applications_count` | Caregivers with `application_status = 'submitted'` |
| `pending_document_reviews_count` | Documents with `verification_status = 'under_review'` |
| `active_clients_count` | Clients with `status = 'active'` |
| `expiring_authorizations_count` | Authorizations with `status = 'expiring_soon'` |

## Upstream Dependencies (must already exist)
These tables are created in earlier specs and are prerequisites for the SQL VIEW:
- `public.organizations` (Spec 01)
- `public.caregiver_profiles` (Spec 02)
- `public.caregiver_documents` (Spec 03)
- `public.clients` (Spec 05)
- `public.client_authorizations` (Spec 06)

## Auth & Role Requirements
- `super_admin` — can view All States, GA, and IN.
- `agency_admin` — can view their own org's state only; multi-state toggle is disabled.
- `coordinator` — **no access** to this dashboard; redirect to their own portal.

## Edge Cases

| Failure Scenario | Root Cause | System Response & Mitigation |
|---|---|---|
| **Cross-Tenant Coordinator Access** | Coordinator attempts viewing out-of-state metrics | API returns `403`. UI automatically disables multi-state toggle for single-state roles. |
| **Empty State** | Org has zero caregivers/clients | VIEW returns zero counts (not null). UI shows `0` with a neutral empty-state illustration. |
| **Export Timeout** | Large org with thousands of records | Export route streams the file response rather than buffering; front-end shows a loading spinner. |

## Acceptance Tests (Gherkin)

```gherkin
Feature: Admin Command Center Reporting

  Scenario: Executive views consolidated multi-state KPIs
    Given a logged-in Super Admin
    When they navigate to the master admin dashboard
    Then KPI metrics aggregate data across both Georgia and Indiana organizations
    And all five KPI cards are visible with non-null values

  Scenario: State filter restricts data to Georgia only
    Given a logged-in Super Admin on the admin dashboard
    When they click the "Georgia" tab
    Then KPI metrics reflect only the With Open Hands organization
    And the work queues show only Georgia caregiver and client records

  Scenario: Agency Admin cannot access cross-state data
    Given a logged-in Agency Admin for the Georgia org
    When they call GET /api/v1/reports/kpis?state=IN
    Then the API returns HTTP 403 Forbidden

  Scenario: Admin exports a state compliance audit packet
    Given a logged-in Super Admin on the admin dashboard
    When they click "Export State Survey Audit Packet" for Georgia in CSV format
    Then the browser downloads a file named "audit_GA_<date>.csv"
    And the file contains caregiver, document, client, and authorization rows
```

## Task Map

| Task | Phase | Deliverable |
|---|---|---|
| task-01 | Database | `view_admin_state_kpis` SQL VIEW |
| task-02 | API | `GET /api/v1/reports/kpis` Express route |
| task-03 | API | `GET /api/v1/reports/export` CSV/PDF export route |
| task-04 | Frontend | Admin dashboard page shell + `StateFilterTabs.tsx` |
| task-05 | Frontend | `MetricCardGrid.tsx` KPI card grid |
| task-06 | Frontend | `UrgentActionQueue.tsx` tabbed work queue |
| task-07 | Frontend | `ComplianceAuditExporter.tsx` download button |
