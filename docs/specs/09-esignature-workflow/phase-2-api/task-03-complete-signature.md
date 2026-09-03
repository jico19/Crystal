# Task 03: Express Route — `POST /api/v1/esign/envelopes/:id/sign`

**Spec:** `09-esignature-workflow` | **Phase:** 2-API | **Task:** 03

## Prerequisites
- Task 01 complete: `signature_envelopes` table exists.
- Task 02 complete: `esign.router.ts`, `esign.service.ts`, `esign.repository.ts` files exist.
- `@crystal/validation` exports `CompleteSignatureSchema`.
- AWS S3 client is configured in `apps/api/src/lib/s3.ts` (or equivalent).

## Context
This task handles in-portal inline signing — the path taken when a caregiver draws or types their signature directly inside the Crystal portal rather than via an external DocuSign/SignWell link. The route receives a base64-encoded signature image, verifies the envelope is still valid (not expired, not already signed), computes a SHA-256 hash of `envelopeId + timestamp`, uploads the signed PDF representation to S3, and marks the envelope `completed`. This is the cryptographic anchoring step required by ESIGN/UETA.

## Stack & Files
- **Layer:** Express API
- **Modify:** `apps/api/src/modules/esign/esign.router.ts` — add `POST /:id/sign` route
- **Modify:** `apps/api/src/modules/esign/esign.controller.ts` — add `signEnvelope` handler
- **Modify:** `apps/api/src/modules/esign/esign.service.ts` — add `completeSignature(envelopeId, payload, req)` function
- **Modify:** `apps/api/src/modules/esign/esign.repository.ts` — add `updateEnvelopeCompleted(id, patch)` function

## Deliverable
An Express route `POST /api/v1/esign/envelopes/:id/sign` that validates `CompleteSignatureSchema`, checks the envelope is not expired/already completed, computes a SHA-256 hash, uploads the signed artifact to S3, updates `signature_envelopes` with `status = 'completed'`, `signed_document_hash`, `signed_at`, `ip_address`, `user_agent`, and `signed_document_storage_path`, and returns `{ success: true, data: { envelopeId, hash, signedAt } }`.

## Inputs

```typescript
// URL param
id: string; // envelope UUID

// Body — validated by CompleteSignatureSchema from @crystal/validation
{
  signature_base64: string; // min 10 chars — base64 PNG from canvas
  agreed_to_terms: true;    // literal true required
}
```

Request headers: `Authorization: Bearer <jwt>`, `X-Forwarded-For` / `req.ip` captured for `ip_address`.

## Outputs

**200 OK — Success**
```json
{
  "success": true,
  "data": {
    "envelopeId": "uuid",
    "hash": "sha256-hex-string",
    "signedAt": "2026-09-03T14:30:00Z"
  }
}
```

**410 Gone** — Envelope `expires_at` is in the past.

**409 Conflict** — Envelope `status` is already `completed`, `declined`, or `voided`.

**403 Forbidden** — Authenticated user is not the `signer_user_id` on this envelope.

**422 Unprocessable Entity** — `CompleteSignatureSchema` validation failed (e.g., `agreed_to_terms` is not `true`).

## Acceptance Criteria
- [ ] SHA-256 hash is computed as `sha256(envelopeId + "-" + timestamp_ms)` and stored in `signed_document_hash`.
- [ ] `ip_address` is stored from `req.ip` (trust proxy must be enabled in Express).
- [ ] If envelope `expires_at < NOW()`, the route returns 410 without modifying the row.
- [ ] If `status` is already `completed`, the route returns 409 without re-hashing.
- [ ] S3 upload key follows the pattern `esign/{org_id}/{envelopeId}/signed.png`; if upload fails, the error is logged and signing proceeds (DB update still commits).

## Do NOT
- Do NOT call any external DocuSign/SignWell API here — this route is for native in-portal signatures only.
- Do NOT implement the webhook handler here — that is Task 04.
- Do NOT expose the S3 pre-signed URL in the response — `signed_document_storage_path` is internal only.
- Do NOT add frontend components in this task.
