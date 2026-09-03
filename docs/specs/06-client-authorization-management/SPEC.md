# Spec 06 — Client Prior Authorization & Utilization Management

## Goal
Provide proactive management, real-time unit consumption tracking, and automated expiration monitoring for Medicaid and insurance Prior Authorizations (PAs), eliminating service lapses and unbillable caregiver hours.

## Problem Statement
Home care agencies frequently suffer revenue loss or unpaid claims when caregivers deliver care against expired or exhausted Medicaid prior authorizations. Tracking authorization periods and unit limits across spreadsheets leads to billing rejections.

---

## Scope Boundaries

### In-Scope
- Authorization tracking: authorized units, start/end dates, procedure codes (T1019, S5125, S5130), weekly hour caps.
- Real-time unit burn-down visualizer (% consumed vs % timeline elapsed).
- Automated 60-day and 30-day expiration alerts to case managers and agency staff.
- Status lifecycle: `active` → `expiring_soon` → `exhausted | expired | renewal_submitted | closed`.
- Re-authorization workflow tracking (`renewal_submitted`).

### Out-of-Scope
- Direct electronic 837/835 EDI clearinghouse claims submission (Phase 1 tracks authorization caps only).
- Caregiver scheduling or shift management.
- Real-time EHR/payer portal integration.

---

## Data Model (summary — no DDL)

### `client_authorizations` table
Key columns: `id`, `client_id`, `org_id`, `payer_name`, `authorization_number`, `procedure_code`, `service_type`, `start_date`, `end_date`, `total_units_authorized`, `total_units_used`, `weekly_hours_cap`, `status` (enum), `notes`, `created_at`, `updated_at`.

> **Unit definition:** 1 unit = 15 minutes of service time.

### Enum: `auth_status_type`
`active | expiring_soon | exhausted | expired | renewal_submitted | closed`

---

## Validation Rules (business logic, no code)

| Field | Rule |
|---|---|
| `end_date` | Must be strictly after `start_date` |
| `total_units_authorized` | Must be a positive number |
| `weekly_hours_cap` | Optional; if provided, must be positive |
| `procedure_code` | Required; common values: `T1019`, `S5125`, `S5130` |
| `authorization_number` | Required; minimum 3 characters; unique per org |
| Units increment | Cannot silently exceed cap — system sets `exhausted` |

---

## Status Transition Rules

| Trigger | Resulting Status |
|---|---|
| Daily cron: `end_date` within 60 days | `expiring_soon` |
| Daily cron: `end_date` within 30 days | `expiring_soon` (alert escalated) |
| Daily cron: `end_date` has passed | `expired` |
| `units_used >= total_units_authorized` | `exhausted` |
| Coordinator marks renewal | `renewal_submitted` |
| Admin closes | `closed` |

---

## Edge Cases

| Failure Scenario | Root Cause | System Response & Mitigation |
|---|---|---|
| **Units consumed exceeds cap** | Over-scheduling of caregiver hours | System sets status `exhausted`; returns HTTP 422 on further unit increments. |
| **Retroactive authorization approval** | Medicaid back-dates approval date | System allows `start_date` in the past; preserves `created_at` as audit timestamp. |
| **Cron runs during DB maintenance** | Infrastructure downtime | Cron implements retry; failed run is logged; next scheduled run picks up missed records. |
| **Duplicate authorization number** | Re-submission error | Unique constraint on `(org_id, authorization_number)` returns HTTP 409. |

---

## Acceptance Tests (Gherkin)

```gherkin
Feature: Client Prior Authorization Tracking

  Scenario: Authorization enters 30-day warning window
    Given an active client authorization with end date 25 days from today
    When the daily Agent-AuthTracker worker runs
    Then the authorization status changes to "expiring_soon"
    And an escalation reminder is dispatched to the agency billing manager

  Scenario: Authorization is created with valid data
    Given an authenticated coordinator
    When they POST to /api/v1/authorizations with valid fields including end_date after start_date
    Then the API returns HTTP 201 with the new authorization record
    And the initial status is "active"

  Scenario: Units are incremented and exhaustion is detected
    Given an authorization with total_units_authorized = 100 and total_units_used = 95
    When the system increments units_used by 6
    Then total_units_used becomes 101
    And the authorization status is automatically set to "exhausted"

  Scenario: Listing authorizations is scoped to org
    Given org "Alpha" has 3 authorizations and org "Beta" has 2
    When an admin of org "Alpha" requests GET /api/v1/authorizations?clientId=<clientId>
    Then only the 3 authorizations belonging to org "Alpha" are returned

  Scenario: Authorization with end_date before start_date is rejected
    Given an authenticated coordinator
    When they POST to /api/v1/authorizations with end_date before start_date
    Then the API returns HTTP 400 with a field error on "end_date"
```

---

## Background Automation

- **Schedule:** Daily cron `0 1 * * *` (01:00 server time) via `node-cron` inside the API process.
- **Workflow:**
  1. Find `active` or `expiring_soon` authorizations where `end_date <= NOW() + 60 days`.
  2. Update status to `expiring_soon` or `expired` as appropriate.
  3. Find authorizations where `total_units_used >= total_units_authorized`; set `exhausted`.
  4. Queue notification to the designated client care coordinator.

---

## Task Map

| Task | Phase | File |
|---|---|---|
| 01 | Database | `phase-1-database/task-01-authorizations-schema.md` |
| 02 | API | `phase-2-api/task-02-create-authorization.md` |
| 03 | API | `phase-2-api/task-03-list-authorizations.md` |
| 04 | API | `phase-2-api/task-04-update-units-used.md` |
| 05 | API | `phase-2-api/task-05-expiration-cron.md` |
| 06 | Frontend | `phase-3-frontend/task-06-authorization-list.md` |
| 07 | Frontend | `phase-3-frontend/task-07-authorization-card.md` |
| 08 | Frontend | `phase-3-frontend/task-08-new-authorization-modal.md` |
