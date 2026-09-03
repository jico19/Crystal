# Spec 09: Electronic Signature & Agreement Workflows

## Goal

Provide a legally binding, ESIGN / UETA compliant digital signature workflow for caregiver employment packets (W-4, I-9, Direct Deposit, Job Descriptions, Non-Compete/Confidentiality) and client intake consents (Service Agreements, Client Bill of Rights, HIPAA Notice of Privacy Practices).

## Problem Statement

Handling signed documents via manual print-sign-scan results in missing initials, unexecuted addendums, slow applicant onboarding cycles, and unverified signature timestamps.

## Scope Boundaries

### In-Scope
- Standardized packet templates with dynamic state variable merging (With Open Hands vs. Cherish Open Arms).
- Embedded in-portal signature pad (canvas or typed signature) and webhook integration with DocuSign / SignWell REST APIs.
- Generation of immutable signed PDF packets with embedded certificate of completion, IP address, and cryptographic SHA-256 hash.

### Out-of-Scope
- Hardware signature pads for in-person retail POS terminals.
- `CertificateOfCompletionBadge.tsx` display badge — this is a v2 addition.

---

## Architecture Overview

```
Frontend (Vite SPA)
  └── calls fetch('/api/v1/esign/...')
        └── Express API (apps/api/src/modules/esign/)
              ├── esign.router.ts
              ├── esign.controller.ts
              ├── esign.service.ts        ← SHA-256 hash, S3 upload, SignWell/DocuSign calls
              └── esign.repository.ts     ← DB queries against signature_envelopes
                    └── PostgreSQL: signature_envelopes table
```

The frontend **never** calls Supabase or an external e-sign provider directly. All provider calls and DB mutations happen inside the Express API.

---

## Data Model Summary

| Table | Purpose |
| :--- | :--- |
| `signature_envelopes` | Tracks one signing envelope per document packet. One row = one signer + one template. |

### Key Columns
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary key |
| `org_id` | UUID | FK → `organizations.id` |
| `status` | `esign_envelope_status` enum | `draft`, `sent`, `partially_signed`, `completed`, `declined`, `voided` |
| `signer_role` | VARCHAR(50) | `caregiver`, `client_rep`, `agency_director` |
| `signer_user_id` | UUID | FK → `auth.users.id` (nullable for external signers) |
| `external_provider_id` | VARCHAR | DocuSign/SignWell envelope ID |
| `signed_document_storage_path` | TEXT | S3 object key |
| `signed_document_hash` | VARCHAR(64) | SHA-256 hex digest |
| `ip_address` | INET | Captured at signing time |
| `expires_at` | TIMESTAMPTZ | 30-day default TTL |

---

## Validation Schemas (`@crystal/validation`)

> Full Zod schema definitions belong in `packages/validation/src/esign.schema.ts`. Tasks reference these by name only.

- **`CreateEnvelopeRequestSchema`** — `org_id` (uuid), `template_type` (enum), `signer_name`, `signer_email`, optional `signer_user_id`, `merge_data` (record).
- **`CompleteSignatureSchema`** — `envelope_id` (uuid), `signature_base64` (min 10 chars), `agreed_to_terms` (literal `true`).

---

## Edge Cases & Failure Recovery Matrix

| Failure Scenario | Root Cause | System Response & Mitigation |
| :--- | :--- | :--- |
| **Declined Signature** | Signer clicks "Decline" | System marks envelope `declined`, requires mandatory feedback reason, and notifies agency coordinator. |
| **Envelope Link Expiration** | Unsigned for > 30 days | System allows 1-click "Resend Fresh Link" from coordinator dashboard. Coordinator must have `coordinator`, `admin`, or `super_admin` role. |
| **Webhook Replay Attack** | Duplicate webhook delivery | HMAC signature verified on every incoming webhook; idempotency check against `external_provider_id` prevents double-processing. |
| **S3 Upload Failure** | Storage outage during signing | Signing completes with hash stamped in DB; S3 upload retried via background job. `signed_document_storage_path` remains NULL until retry succeeds. |
| **Base64 Signature Too Small** | User clears canvas before submitting | Frontend disables "Complete Signing" button until canvas has minimum pixel data; backend rejects with 422 if `signature_base64` < 10 chars. |

---

## Acceptance Tests (Gherkin)

```gherkin
Feature: Electronic Signature Workflow

  Scenario: Caregiver completes electronic packet signature
    Given a caregiver presented with the onboarding agreement packet
    When the caregiver draws their signature and checks legal consent
    And clicks "Complete Signing"
    Then the envelope status changes to "completed"
    And a tamper-evident SHA-256 hash is stamped on the signed PDF record

  Scenario: Coordinator creates an envelope for a caregiver
    Given a coordinator with role "coordinator" authenticated to the API
    When they POST to /api/v1/esign/envelopes with valid CreateEnvelopeRequestSchema payload
    Then a new row is inserted into signature_envelopes with status "sent"
    And the response body contains { success: true, data: { envelopeId, signingUrl } }

  Scenario: SignWell webhook marks envelope as completed
    Given a valid HMAC-signed webhook payload from SignWell
    When POST /api/v1/esign/webhook is received
    Then the matching envelope row is updated to status "completed"
    And signed_at is set to the webhook event timestamp

  Scenario: Expired envelope cannot be re-signed
    Given an envelope where expires_at is in the past
    When the signer attempts POST /api/v1/esign/envelopes/:id/sign
    Then the API returns HTTP 410 Gone
    And the envelope status remains unchanged

  Scenario: Unauthorized user cannot view another user's envelope
    Given a caregiver user who is not the signer_user_id on an envelope
    When they GET /api/v1/esign/envelopes/:id
    Then the API returns HTTP 403 Forbidden
```

---

## Task Breakdown

| Task | Phase | File | Deliverable |
| :--- | :--- | :--- | :--- |
| 01 | Database | `phase-1-database/task-01-signature-envelopes-schema.md` | `signature_envelopes` DDL + enum + RLS |
| 02 | API | `phase-2-api/task-02-create-envelope.md` | `POST /api/v1/esign/envelopes` |
| 03 | API | `phase-2-api/task-03-complete-signature.md` | `POST /api/v1/esign/envelopes/:id/sign` |
| 04 | API | `phase-2-api/task-04-webhook-handler.md` | `POST /api/v1/esign/webhook` |
| 05 | API | `phase-2-api/task-05-get-envelope-status.md` | `GET /api/v1/esign/envelopes/:id` |
| 06 | Frontend | `phase-3-frontend/task-06-signature-container.md` | `DocumentSigningContainer.tsx` |
| 07 | Frontend | `phase-3-frontend/task-07-signature-canvas.md` | `SignatureCanvasPad.tsx` |
| 08 | Frontend | `phase-3-frontend/task-08-consent-checkbox.md` | `ConsentAttestationCheckbox.tsx` |
