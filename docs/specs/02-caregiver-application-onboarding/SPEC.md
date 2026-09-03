# SPEC: Caregiver Application & Onboarding Funnel

## Goal
Provide a secure, mobile-first, multi-step digital job application and onboarding funnel allowing prospective caregivers in Georgia (*With Open Hands*) and Indiana (*Cherish Open Arms*) to register, complete a 5-step application wizard, save progress, submit required legal disclosures, and track their onboarding status in real time.

---

## Problem Statement
Caregiver recruiting previously suffered from high candidate drop-off due to paper packets, lost email attachments, unencrypted PII transmission, and no real-time hiring status visibility. This system replaces that with a wizard that has draft persistence, PII encryption at rest, and automated coordinator notifications.

---

## Scope

### In-Scope
- 5-Step Application Wizard: (1) Personal Info, (2) Availability & Positions, (3) Experience & References, (4) Licensure, (5) Legal Disclosures & Attestation.
- Draft persistence with auto-save to PostgreSQL via Express API.
- JWT-authenticated routes — only the logged-in caregiver may read/write their own profile.
- Row-Level Security restricting applicant access to their own `caregiver_profiles` row.
- SES notification to applicant and coordinator on final submission.

### Out-of-Scope
- Direct state registry API scraping (coordinator workflow + OCR agent, Module 03).
- Third-party background check webhook processing (Module 03).
- SSN encryption at rest (noted in schema; deferred to a security hardening task — do NOT implement `pgcrypto` encryption in these tasks).

---

## Architecture Overview
The wizard lives in the **Vite React SPA** at `apps/georgia/src/pages/apply/` (mirrored for Indiana). Each step submits data via `fetch('/api/v1/...')` with a Bearer JWT. The **Express v5 API** validates with Zod, writes to `caregiver_profiles`, and dispatches SES on submission. The frontend never touches PostgreSQL directly.

---

## Wizard Steps Summary

| Step | Route Segment | Key Data Collected |
|:---|:---|:---|
| 1 | `personal-info` | Name, email, phone, DOB (18+ check), SSN (display masked), home address |
| 2 | `availability` | Positions applied (CNA/HHA/PCA/RN/LPN/companion), shift preferences, max hours, travel miles |
| 3 | `experience` | Work history (repeater), professional references (min 2) |
| 4 | `licenses` | License type, number, issuing state, expiration date (repeater, optional) |
| 5 | `attestation` | US work authorization, felony disclosure, drug screen consent, background check consent, typed legal signature |

---

## Data Model (Reference — no DDL here)

### Enums
- `caregiver_status_type`: `draft` | `submitted` | `under_review` | `additional_info_requested` | `approved` | `rejected` | `archived`
- `onboarding_step_status_type`: `not_started` | `in_progress` | `submitted` | `verified` | `rejected`

### `caregiver_profiles` table
One row per applicant. Key columns: `user_id` (FK → auth.users, UNIQUE), `org_id` (FK → organizations), `state_code`, `application_status` (enum), `application_step` (1–5), `personal_info` (JSONB), `positions_applied` (TEXT[]), `availability` (JSONB), `experience_history` (JSONB), `professional_licenses` (JSONB), `references` (JSONB), `legal_disclosures` (JSONB), `onboarding_checklist` (JSONB), `submitted_at`, `approved_at`.

---

## Zod Schemas (Reference — defined in `@crystal/validation`)

| Schema | Step | Purpose |
|:---|:---|:---|
| `PersonalInfoStepSchema` | 1 | Name, phone, DOB (18+ refine), SSN regex, address |
| `AvailabilityStepSchema` | 2 | Positions enum array, shift/day arrays, hours/miles numbers |
| `ExperienceStepSchema` | 3 | Work history array (min 1), references array (min 2) |
| `LicensesStepSchema` | 4 | Optional license array with type enum, number, issuing state, expiry |
| `LegalDisclosuresStepSchema` | 5 | `literal(true)` for consent fields, typed signature string |
| `CompleteCaregiverApplicationSchema` | Final | Composed union of all 5 steps for server-side final validation |

---

## Wizard State Machine (Reference)

```
[ STEP_LOADED ] -> (user types) -> [ DIRTY ] -> (500ms debounce) -> [ AUTO_SAVING ]
       |                                                                    |
 (click Next)                                                         (saved OK)
       v                                                                    v
[ CLIENT_VALIDATION ] -> (valid) -> [ PERSIST_STEP ] -> (success) -> [ NEXT_STEP ]
       |
   (invalid)
       v
[ HIGHLIGHT_ERRORS ]
```

---

## Edge Cases

| Failure Scenario | Root Cause | System Response |
|:---|:---|:---|
| **Mid-Form Network Drop** | Candidate loses mobile internet | LocalStorage caches active step; toast alerts user; re-syncs on reconnect. |
| **Duplicate SSN Submission** | Candidate previously registered | Server detects duplicate `user_id` unique constraint; returns friendly *"Account already exists. Please log in."* |
| **Applicant Under 18** | DOB validation fails (< 18 years) | Zod refine blocks progression; inline error: *"Applicants must be 18+ to meet state regulatory requirements."* |
| **Session Timeout During Wizard** | JWT expires after inactivity | Draft state persisted in DB at current step; candidate resumes at same step upon re-login. |

---

## Acceptance Tests (Gherkin)

```gherkin
Feature: Caregiver Application & Onboarding Wizard

  Scenario: Applicant completes Step 1 and resumes draft later
    Given an applicant enters personal details and SSN on Step 1
    When the applicant clicks "Save & Exit" and logs out
    And logs back in after 2 hours
    Then the wizard opens at Step 1 with all previously entered data populated
    And the SSN input displays masked as "***-**-1234"

  Scenario: Underage applicant validation
    Given an applicant enters a date of birth corresponding to age 17
    When the applicant attempts to proceed to Step 2
    Then the step transition is blocked
    And an inline error displays "Applicant must be at least 18 years old"

  Scenario: Successful full application submission
    Given an applicant completes all 5 wizard steps with valid data
    When the applicant types their legal name and clicks "Submit Application"
    Then the application_status changes to "submitted" in caregiver_profiles
    And a confirmation email is dispatched to the applicant email address
    And the state coordinator dashboard receives a new applicant notification badge
```

---

## Background Automation (Reference)
- **On `caregiver_profiles` INSERT**: Welcome email + magic link sent to applicant.
- **On `application_status` -> `submitted`**: `Agent-Compliance` notifies coordinator; provisions `caregiver_documents` checklist records; unlocks onboarding portal dashboard.
