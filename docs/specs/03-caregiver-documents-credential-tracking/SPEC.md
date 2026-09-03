# SPEC: Caregiver Documents & Credential Tracking

**Spec ID:** `03-caregiver-documents-credential-tracking`

---

## Goal

Provide secure document upload, storage, automated OCR extraction, verification workflows, and automated expiration tracking for caregiver compliance records (CPR, CNA, TB tests, physicals, driver's licenses, auto insurance), ensuring zero lapsed credentials across Georgia and Indiana teams.

## Problem Statement

Operating home care agencies without airtight credential tracking exposes the agency to state regulatory penalties, license revocation, and liability. Manual spreadsheet tracking results in missed expiration dates, lost paper records, and unencrypted transmission of sensitive PHI/PII.

---

## Scope Boundaries

### In-Scope
- Secure multi-format document upload (PDF, PNG, JPEG, HEIC up to 25 MB).
- Private AWS S3 bucket with 15-minute expiring presigned PUT and GET URLs.
- Automated OCR extraction integration (`Agent-DocOCR`) for pre-filling license numbers and expiration dates.
- Verification workflow: Approve, Reject with Reason, Request Replacement.
- Daily compliance monitoring worker with 90/60/30/15/7/0-day automated escalation reminders.
- Immutable audit log of all document actions (upload, view, download, approve, reject, expire).

### Out-of-Scope
- Direct real-time biometrics / live fingerprint scanning hardware integration.
- Real-time OCR during upload (OCR runs asynchronously post-upload).

---

## Key Domain Concepts

| Term | Definition |
|---|---|
| `caregiver_documents` | DB table storing one record per uploaded file, including status and metadata |
| `document_audit_logs` | Immutable append-only table recording every access or decision event |
| Presigned URL | A time-limited, signed S3 URL allowing the browser to PUT/GET directly to/from S3 without exposing credentials |
| `has_no_expiration` | Boolean flag for evergreen documents (e.g., Social Security Card, W-4) that have no expiry date |
| Compliance score | Percentage of required document categories that are in `approved` status |

### Document Categories (Enum)
`drivers_license` | `social_security_card` | `cpr_first_aid` | `cna_hha_license` | `tb_test_screen` | `physical_exam` | `background_check_report` | `auto_insurance` | `direct_deposit_form` | `w4_i9_form` | `other_compliance_doc`

### Verification Statuses (Enum)
`pending_upload` -> `under_review` -> `approved` | `rejected` | `expired`

### Audit Log Actions
`UPLOAD` | `VIEW_PREVIEW` | `DOWNLOAD` | `APPROVE` | `REJECT` | `EXPIRE`

---

## Zod Schema Names (defined in `@crystal/validation`)

- `DocumentUploadSchema` — validates category, file_name, file_size_bytes (max 25 MB), mime_type, issue_date, expiration_date, has_no_expiration
- `DocumentReviewSchema` — validates document_id, decision (`approved`|`rejected`), rejection_reason, corrected_expiration_date

---

## Background Automation & Agent Triggers

- **Cron:** Daily midnight (`0 0 * * *`)
- `Agent-DocOCR` inspects newly uploaded PDFs/images, extracts license numbers and expiry dates, populates `ocr_extracted_data` JSONB column.
- `Agent-Compliance` evaluates all active records. At 30 days from expiration it triggers automated SMS + email to the caregiver and places an alert badge on the coordinator review desk.

---

## Edge Cases

| Failure Scenario | Root Cause | System Response & Mitigation |
|---|---|---|
| **Blurry or Unreadable Upload** | Low-quality camera photo | OCR Agent confidence < 60% flags document as "Low Quality Scan" for coordinator review |
| **Expired Presigned URL** | User leaves preview open > 15 min | Secure viewer detects 403 and automatically requests a fresh presigned URL |
| **Missing Expiration on Evergreen Doc** | Social Security Card or W-4 | UI allows checking `has_no_expiration: true`, bypassing automated expiration alerts |
| **Upload network failure mid-transfer** | Browser disconnect | Caregiver retries; new presigned URL is requested; orphaned S3 key cleaned up by lifecycle rule |
| **Coordinator reviews wrong org document** | Missing org scope check | API enforces `org_id` match on all review endpoints; RLS enforces at DB level |

---

## Acceptance Tests (Gherkin)

```gherkin
Feature: Caregiver Document Credential Tracking

  Scenario: Caregiver uploads CPR certification
    Given an authenticated caregiver on the documents page
    When the caregiver uploads a valid 2MB PDF for "CPR / First Aid"
    Then the file is securely saved to encrypted S3 storage
    And a record is created in "caregiver_documents" with status "under_review"
    And an immutable "UPLOAD" audit log entry is generated

  Scenario: Coordinator approves a document
    Given a document in "under_review" status
    When a coordinator submits an approval decision via PUT /api/v1/documents/:id/review
    Then the document status changes to "approved"
    And an "APPROVE" audit log entry is written with the coordinator user_id

  Scenario: Coordinator rejects a document with a reason
    Given a document in "under_review" status
    When a coordinator submits a rejection with reason "Expiry date is illegible"
    Then the document status changes to "rejected"
    And rejection_reason is stored in the caregiver_documents row
    And a "REJECT" audit log entry is written

  Scenario: Expiration notification trigger
    Given a caregiver with a CNA license expiring in 30 days
    When the daily compliance monitoring agent executes
    Then an urgent renewal notification email and SMS are dispatched to the caregiver
    And the document status badge displays "Expiring Soon (30 days)"

  Scenario: Caregiver views compliance score
    Given a caregiver with 8 of 10 required document categories approved
    When the caregiver visits the documents page
    Then the ComplianceScoreBanner displays "80% Compliant"
```

---

## Task Map

| Task | Phase | Title |
|---|---|---|
| task-01 | Database | Documents schema, enums, RLS, indexes |
| task-02 | API | POST /api/v1/documents/upload-url |
| task-03 | API | POST /api/v1/documents/:id/confirm |
| task-04 | API | GET /api/v1/documents/:id/download-url |
| task-05 | API | PUT /api/v1/documents/:id/review |
| task-06 | Frontend | DocumentChecklistTable |
| task-07 | Frontend | DocumentUploadModal |
| task-08 | Frontend | ComplianceScoreBanner |
