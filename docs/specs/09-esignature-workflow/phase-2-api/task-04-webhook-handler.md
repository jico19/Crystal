# Task 04: Express Route — `POST /api/v1/esign/webhook`

**Spec:** `09-esignature-workflow` | **Phase:** 2-API | **Task:** 04

## Prerequisites
- Task 01 complete: `signature_envelopes` table exists.
- Task 02 complete: `esign.repository.ts` exists with DB access patterns.
- Environment variable `ESIGN_WEBHOOK_SECRET` is set (HMAC signing key from SignWell/DocuSign dashboard).
- The Express app uses `express.raw({ type: 'application/json' })` on the webhook route (raw body required for HMAC verification).

## Context
External e-sign providers (SignWell, DocuSign) send HTTP POST callbacks to notify the Crystal API when envelope events occur (completed, declined, voided). This route MUST verify the incoming HMAC signature before trusting any payload data — failure to do so is a security vulnerability. After verification it maps the provider's event type to the internal `esign_envelope_status` enum and updates the matching `signature_envelopes` row. The route is **not protected by `verifyJWT`** — it is a public webhook endpoint authenticated solely by HMAC.

## Stack & Files
- **Layer:** Express API
- **Modify:** `apps/api/src/modules/esign/esign.router.ts` — add `POST /webhook` before other routes, with raw body middleware
- **Modify:** `apps/api/src/modules/esign/esign.controller.ts` — add `handleWebhook` handler
- **Modify:** `apps/api/src/modules/esign/esign.service.ts` — add `processWebhookEvent(rawBody, signature, provider)` function
- **Modify:** `apps/api/src/modules/esign/esign.repository.ts` — add `updateEnvelopeByExternalId(providerId, patch)` function

## Deliverable
An Express route `POST /api/v1/esign/webhook` that reads the raw request body, verifies the HMAC-SHA256 signature against `ESIGN_WEBHOOK_SECRET`, maps the provider event to an internal status, updates the `signature_envelopes` row matched by `external_provider_id`, and returns `{ received: true }` with HTTP 200.

## Inputs

**Headers**
```
X-SignWell-Signature: <hmac-sha256-hex>   # SignWell
X-DocuSign-Signature-1: <hmac-sha256>     # DocuSign (alternative)
```

**Body (raw JSON — provider-specific, example SignWell shape)**
```json
{
  "event": "document_completed",
  "data": {
    "document": {
      "id": "<external_provider_id>",
      "status": "completed",
      "completed_at": "2026-09-03T14:30:00Z"
    }
  }
}
```

## Outputs

**200 OK — Accepted**
```json
{ "received": true }
```

**400 Bad Request** — HMAC signature mismatch.
```json
{ "error": "Invalid webhook signature" }
```

**404 Not Found** — No `signature_envelopes` row with matching `external_provider_id`.

**200 OK — Idempotent (already processed)**
```json
{ "received": true, "skipped": true }
```

## Acceptance Criteria
- [ ] A request with a valid HMAC signature updates the envelope status in the DB and returns 200.
- [ ] A request with an invalid or missing HMAC signature returns 400 — no DB write occurs.
- [ ] If the envelope is already `completed`, the handler returns 200 with `skipped: true` and makes no DB update (idempotency).
- [ ] `signed_at` is set from the provider's event timestamp when the event type is `document_completed`.
- [ ] Both SignWell (`X-SignWell-Signature`) and DocuSign (`X-DocuSign-Signature-1`) header names are checked; the route works with either provider.

## Do NOT
- Do NOT apply `verifyJWT` or `requireRole` middleware to this route — it is a public webhook.
- Do NOT parse the body with `express.json()` on this route — HMAC requires the raw buffer.
- Do NOT implement inline signature capture (base64 canvas) here — that is Task 03.
- Do NOT add frontend components in this task.
