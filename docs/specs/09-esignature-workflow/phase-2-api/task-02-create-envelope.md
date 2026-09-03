# Task 02: Express Route — `POST /api/v1/esign/envelopes`

**Spec:** `09-esignature-workflow` | **Phase:** 2-API | **Task:** 02

## Prerequisites
- Task 01 complete: `signature_envelopes` table and `esign_envelope_status` enum exist in PostgreSQL.
- `apps/api/src/middleware/verifyJWT.ts` and `requireRole.ts` exist (from Spec 10, Task 02, or already shipped).
- `apps/api/src/db/` database client (pg/knex/drizzle) is configured.
- `@crystal/validation` package exists with `CreateEnvelopeRequestSchema` exported from `packages/validation/src/esign.schema.ts`.

## Context
This task wires up the first Express route in the `esign` module. A coordinator or admin POSTs envelope metadata and a template type; the API merges template variables, creates a `signature_envelopes` row, optionally dispatches a signing request to the external SignWell or DocuSign REST API, and returns a signing URL for the frontend to render inside `DocumentSigningContainer`. The external provider call is fire-and-forget if the org has not configured a provider — a native in-portal signing URL is returned instead.

## Stack & Files
- **Layer:** Express API
- **Create:** `apps/api/src/modules/esign/esign.router.ts` — mounts `POST /envelopes` with auth middleware
- **Create:** `apps/api/src/modules/esign/esign.controller.ts` — request parsing, validation, response shaping
- **Create:** `apps/api/src/modules/esign/esign.service.ts` — business logic: template merge, optional provider call
- **Create:** `apps/api/src/modules/esign/esign.repository.ts` — `insertEnvelope(data)` DB function
- **Modify:** `apps/api/src/app.ts` — register `esign.router` under `/api/v1/esign`

## Deliverable
An Express route `POST /api/v1/esign/envelopes` that validates input with `CreateEnvelopeRequestSchema`, inserts a new row into `signature_envelopes` with status `sent`, optionally calls the SignWell/DocuSign API to create an external envelope, and returns `{ success: true, data: { envelopeId, signingUrl } }`.

## Inputs

```typescript
// Body — validated by CreateEnvelopeRequestSchema from @crystal/validation
{
  org_id: string;           // uuid
  template_type: 'caregiver_onboarding_packet' | 'client_service_agreement';
  signer_name: string;      // min 2 chars
  signer_email: string;     // valid email
  signer_user_id?: string;  // uuid, optional for external signers
  merge_data: Record<string, unknown>; // template variable overrides
}
```

Request headers: `Authorization: Bearer <jwt>` (verified by `verifyJWT` middleware).

## Outputs

**201 Created — Success**
```json
{
  "success": true,
  "data": {
    "envelopeId": "uuid",
    "signingUrl": "https://..." 
  }
}
```

**422 Unprocessable Entity — Validation Error**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [ /* Zod error array */ ]
}
```

**401 Unauthorized** — Missing or invalid JWT.

**403 Forbidden** — Role not in `['coordinator', 'admin', 'super_admin']`.

## Acceptance Criteria
- [ ] A valid POST by a `coordinator` user returns 201 with `envelopeId` and `signingUrl`.
- [ ] The inserted `signature_envelopes` row has `status = 'sent'` and `expires_at = NOW() + INTERVAL '30 days'`.
- [ ] A POST without `agreed_to_terms` or with an invalid `signer_email` returns 422 with Zod error details.
- [ ] A POST by a `caregiver` role returns 403 Forbidden.
- [ ] When no external provider is configured, `signingUrl` is a relative in-portal URL of the form `/sign/:envelopeId`.

## Do NOT
- Do NOT call Supabase directly — use the Express DB client in `apps/api/src/db/`.
- Do NOT implement the inline signature capture flow here — that is Task 03.
- Do NOT implement the webhook endpoint here — that is Task 04.
- Do NOT add frontend components or pages in this task.
