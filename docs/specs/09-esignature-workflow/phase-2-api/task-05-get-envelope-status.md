# Task 05: Get Envelope Status Express Route
**Spec:** `09-esignature-workflow` | **Phase:** 2-API | **Task:** 05

## Prerequisites
- [x] Task 01: `signature_envelopes` table exists

## Context
Fetches current electronic signature envelope details, status (`draft`, `sent`, `partially_signed`, `completed`, `declined`), signer metadata, and signed document download references.

## Stack & Files
- **Layer:** Express API
- **Modify:** `apps/api/src/modules/esign/esign.router.ts` — mount `GET /envelopes/:id`
- **Modify:** `apps/api/src/modules/esign/esign.controller.ts`

## Deliverable
An Express route `GET /api/v1/esign/envelopes/:id` verifying authorization (signer or agency staff matching `org_id`), returning envelope metadata and presigned download URL if completed.

## Inputs
- Route parameter `:id` (Envelope UUID)

## Outputs
- `200 OK`: `{ success: true, data: { envelope: Envelope, downloadUrl?: string } }`
- `401 Unauthorized`: Missing token
- `403 Forbidden`: User is neither the signer nor an authorized staff member

## Acceptance Criteria
- [ ] Returns 200 with envelope details if user is authorized
- [ ] Generates S3 presigned GET URL for `signed_document_storage_path` if status is `completed`
- [ ] Denies access to unauthorized third parties

## Do NOT
- Do not expose private S3 paths directly — return short-lived signed URLs only
