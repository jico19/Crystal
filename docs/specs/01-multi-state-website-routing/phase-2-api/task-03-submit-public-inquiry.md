# Task 03: Build POST /api/v1/inquiries Route

**Spec:** `01-multi-state-website-routing` | **Phase:** 2-API | **Task:** 03

## Prerequisites
- Task 01 complete: `public_inquiries` table and RLS policies exist.
- Task 02 complete: `organizations` module folder structure exists (repository pattern established).
- AWS SES is configured in the API environment (`SES_FROM_EMAIL`, `SES_REGION` env vars set).
- `apps/api/src/app.ts` has a `/api/v1` router.

## Context
The public contact form on each state SPA posts to this route. The route validates the submission with `CreatePublicInquirySchema` from `@crystal/validation`, performs a honeypot check (silent bot drop), writes the lead to `public_inquiries`, and dispatches an SES notification to the state coordinator. If SES fails, the response still returns success — the DB record is the source of truth. This route is unauthenticated (public form submission).

## Stack & Files
- **Layer:** Express API
- **Create:** `apps/api/src/modules/inquiries/inquiries.router.ts` — mounts `POST /` route
- **Create:** `apps/api/src/modules/inquiries/inquiries.controller.ts` — validates body with `CreatePublicInquirySchema`, extracts client IP from `x-forwarded-for` header, calls service
- **Create:** `apps/api/src/modules/inquiries/inquiries.service.ts` — honeypot check, calls repository insert, calls SES mailer (non-blocking try/catch)
- **Create:** `apps/api/src/modules/inquiries/inquiries.repository.ts` — parameterized `INSERT INTO public_inquiries (...) VALUES (...) RETURNING id`
- **Create:** `apps/api/src/modules/inquiries/inquiries.schema.ts` — re-exports `CreatePublicInquirySchema` from `@crystal/validation` (single source of truth)
- **Create:** `apps/api/src/lib/ses-mailer.ts` — `sendLeadNotificationEmail(payload)` function using AWS SDK v3 `SendEmailCommand`
- **Modify:** `apps/api/src/app.ts` — mount `inquiriesRouter` at `/api/v1/inquiries`

## Deliverable
An Express route `POST /api/v1/inquiries` that validates input with `CreatePublicInquirySchema`, silently drops bot submissions (populated honeypot), inserts a `public_inquiries` row with `status = 'new'`, fires a non-blocking SES notification, and returns `{ success: true, data: { inquiryId: string } }`.

## Inputs
```typescript
// Body — validated against CreatePublicInquirySchema from @crystal/validation
{
  org_id: string;          // UUID of the state organization
  state_code: "GA" | "IN" | "FL";
  full_name: string;       // min 2, max 100
  email: string;           // valid email
  phone: string;           // US phone regex
  inquiry_type: "caregiver_inquiry" | "client_care_inquiry" | "general_question";
  message: string;         // min 10, max 2000
  source_url: string;      // valid URL of the page the form was on
  honeypot?: string;       // must be empty — bots fill this field
}
```

## Outputs
**201 Created (real submission):**
```json
{ "success": true, "data": { "inquiryId": "uuid" } }
```
**200 OK (bot honeypot triggered — silent drop):**
```json
{ "success": true, "data": { "inquiryId": "noop" } }
```
**422 Unprocessable Entity (Zod validation failure):**
```json
{
  "success": false,
  "error": "Validation failed",
  "fieldErrors": { "phone": ["Invalid US phone number"], "message": ["..."] }
}
```
**500 Internal Server Error (DB write failed):**
```json
{ "success": false, "error": "Submission failed. Please try again later." }
```

## Acceptance Criteria
- [ ] `POST /api/v1/inquiries` with all valid fields returns `201` and a new UUID `inquiryId`.
- [ ] A row with `status = 'new'` appears in `public_inquiries` matching the submitted `org_id`.
- [ ] Submitting with `honeypot: "bot-text"` returns `200 { success: true, data: { inquiryId: "noop" } }` and NO row is written to the DB.
- [ ] Submitting with `phone: "12345"` returns `422` with `fieldErrors.phone` populated.
- [ ] If SES throws, the route still returns `201` (SES failure is logged, not propagated to client).

## Do NOT
- Do not require a JWT or any authentication header on this route.
- Do not block the HTTP response while waiting for SES — fire-and-forget with `try/catch`.
- Do not expose raw Postgres error messages to the client.
- Do not implement inquiry status update or list endpoints in this task.
