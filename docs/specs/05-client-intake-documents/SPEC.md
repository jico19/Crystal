# Spec 05 — Client Intake & Document Management

## Goal
Provide a streamlined, secure digital intake, document ingestion, and assessment management workflow for prospective home care clients across Georgia and Indiana, coordinating emergency contacts, payer details (Medicaid / Private Pay / VA), service plans, and physician orders.

## Problem Statement
Client admissions are slowed by cumbersome paper intake packets, illegible handwritten insurance details, and fragmented clinical notes. Delays in gathering signed consent packets and physician orders risk regulatory non-compliance and delayed commencement of care.

---

## Scope Boundaries

### In-Scope
- Client profile **lifecycle**: `inquiry` → `intake_pending` → `assessment_scheduled` → `active` → `on_hold` → `discharged`.
- Structured data capture: Demographics, Emergency Contacts (repeating), Medical Diagnoses / Allergies, ADLs / IADLs assistance needs, Payer Information.
- Document vault for Clinical Assessments, Physician Orders (485), Face-to-Face evaluations, and Service Agreements — stored in S3 via presigned URL upload.
- List and profile views scoped to `org_id` (multi-tenant).

### Out-of-Scope
- Real-time HL7 / FHIR EHR bidirectional synchronisation (manual PDF / OCR ingestion for Phase 1).
- Caregiver scheduling or shift management.
- Direct billing submission.

---

## Data Model (summary — no DDL)

### `clients` table
Key columns: `id`, `org_id`, `state_code` (`GA | IN | FL`), `status` (enum), `first_name`, `last_name`, `dob`, `primary_phone`, `service_address` (JSONB), `emergency_contacts` (JSONB array), `primary_physician` (JSONB), `care_needs` (JSONB), `primary_payer` (enum), `payer_details` (JSONB), `assigned_rn_id`.

### `client_documents` table
Key columns: `id`, `client_id`, `org_id`, `doc_type`, `file_storage_path`, `file_name`, `file_size_bytes`, `mime_type`, `effective_date`, `expiration_date`, `uploaded_by`.

### Enums
- `client_status_type`: `inquiry | intake_pending | assessment_scheduled | active | on_hold | discharged`
- `payer_type`: `medicaid_waiver | private_pay | va_community_care | long_term_care_insurance | commercial_insurance`

---

## Validation Rules (business logic, no code)

| Field | Rule |
|---|---|
| `emergency_contacts` | At least 1 required; at most 1 `is_primary = true` |
| `medicaid_id` | Required when `primary_payer = 'medicaid_waiver'` |
| `primary_phone` | Must be a valid US phone number |
| `dob` | Must be `YYYY-MM-DD`; client must be ≥ 18 years old |
| `state_code` | Must be one of `GA`, `IN`, `FL` |
| `service_address.zip` | Must match `\d{5}(-\d{4})?` |

---

## Valid Status Transitions

| From | Allowed Next Statuses |
|---|---|
| `inquiry` | `intake_pending` |
| `intake_pending` | `assessment_scheduled`, `discharged` |
| `assessment_scheduled` | `active`, `on_hold`, `discharged` |
| `active` | `on_hold`, `discharged` |
| `on_hold` | `active`, `discharged` |
| `discharged` | *(terminal)* |

---

## Edge Cases

| Failure Scenario | Root Cause | System Response & Mitigation |
|---|---|---|
| **Missing Medicaid ID on Medicaid Payer** | Incomplete intake entry | Zod schema conditionally enforces `medicaid_id` when `primary_payer = 'medicaid_waiver'`. |
| **Duplicate Client Record** | Same DOB and name entered twice | API detects match on `(org_id, first_name, last_name, dob)` and returns HTTP 409 with prompt. |
| **Invalid status transition** | Coordinator tries to skip lifecycle steps | API returns HTTP 422 listing valid next statuses from the current state. |
| **S3 upload fails after presigned URL issued** | Network / client error | Document record is NOT created until the client confirms upload; no orphan rows. |

---

## Acceptance Tests (Gherkin)

```gherkin
Feature: Client Intake Management

  Scenario: Coordinator creates new client intake record
    Given an authenticated coordinator for Georgia
    When the coordinator submits valid intake data for client "Robert Smith"
    Then a new client record is created with status "intake_pending"
    And the service address is assigned to Georgia territory

  Scenario: Medicaid payer requires Medicaid ID
    Given an authenticated coordinator
    When the coordinator submits intake data with primary_payer "medicaid_waiver" but no medicaid_id
    Then the API returns HTTP 400 with a field error on "medicaid_id"

  Scenario: Duplicate client is detected
    Given a client "Jane Doe" born "1975-04-12" already exists in org "Alpha Home Care"
    When a coordinator submits intake for "Jane Doe" born "1975-04-12" in the same org
    Then the API returns HTTP 409 with message "A client with this name and DOB already exists"

  Scenario: Admin lists active Georgia clients
    Given 5 active clients in Georgia and 3 in Indiana for org "Alpha Home Care"
    When an admin requests GET /api/v1/clients?state_code=GA&status=active
    Then the response contains exactly 5 clients

  Scenario: Coordinator uploads physician order document
    Given an active client with id "abc-123"
    When the coordinator requests a presigned upload URL for doc_type "physician_orders_485"
    Then the API returns a presigned S3 URL valid for 15 minutes
```

---

## Task Map

| Task | Phase | File |
|---|---|---|
| 01 | Database | `phase-1-database/task-01-clients-schema.md` |
| 02 | API | `phase-2-api/task-02-create-client-intake.md` |
| 03 | API | `phase-2-api/task-03-list-clients.md` |
| 04 | API | `phase-2-api/task-04-get-client-profile.md` |
| 05 | API | `phase-2-api/task-05-update-client-status.md` |
| 06 | API | `phase-2-api/task-06-client-document-upload.md` |
| 07 | Frontend | `phase-3-frontend/task-07-client-roster.md` |
| 08 | Frontend | `phase-3-frontend/task-08-intake-form.md` |
| 09 | Frontend | `phase-3-frontend/task-09-client-profile-page.md` |
