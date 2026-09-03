# Task 04: Build POST /api/v1/caregivers/application/submit Route (Final Submit)

**Spec:** `02-caregiver-application-onboarding` | **Phase:** 2-API | **Task:** 04

## Prerequisites
- Tasks 01–03 complete: `caregiver_profiles` schema and draft API routes are deployed.
- Auth middleware (`verifyJWT`) operational.
- AWS SES mailer helper exists in `apps/api/src/lib/ses-mailer.ts`.
- `@crystal/validation` exports `LegalDisclosuresStepSchema` and `CompleteCaregiverApplicationSchema`.

## Context
This route finalizes the caregiver application process. When the applicant completes Step 5 (Legal Disclosures & Attestation) and clicks "Submit Application", this endpoint authenticates the candidate, validates the Step 5 disclosure payload, verifies that the existing draft in the database is complete across all 5 steps, updates `application_status` to `'submitted'`, sets `submitted_at = NOW()`, updates the `onboarding_checklist` milestone (`application_form = 'submitted'`), and dispatches SES confirmation emails to both the applicant and the state recruiting coordinator.

## Stack & Files
- **Layer:** Express API
- **Modify:** `apps/api/src/modules/caregivers/caregivers.router.ts` — add `POST /application/submit` route with `verifyJWT`
- **Modify:** `apps/api/src/modules/caregivers/caregivers.controller.ts` — add `submitApplication` controller handler
- **Modify:** `apps/api/src/modules/caregivers/caregivers.service.ts` — add `finalizeApplication` orchestration logic (whole-profile validation, status transition, SES notification)
- **Modify:** `apps/api/src/modules/caregivers/caregivers.repository.ts` — add `getProfileByUserId` and `submitProfile` queries
- **Modify:** `apps/api/src/lib/ses-mailer.ts` — add `sendApplicationSubmittedEmails({ applicantEmail, applicantName, stateCode, orgId })`

## Deliverable
An Express route `POST /api/v1/caregivers/application/submit` that validates Step 5 legal disclosures, validates the entire draft profile for completeness, transitions `caregiver_profiles.application_status` to `'submitted'`, sets `submitted_at = NOW()`, sends SES email notifications, and returns `{ success: true, data: { profileId, status: 'submitted', submittedAt } }`.

## Inputs
```typescript
// Headers: Authorization: Bearer <jwt>
// Body — validated against LegalDisclosuresStepSchema:
{
  authorized_to_work_in_us: true,       // literal(true) required
  felony_conviction: boolean,
  felony_explanation?: string;          // required if felony_conviction is true
  drug_screen_consent: true,            // literal(true) required
  background_check_consent: true,       // literal(true) required
  attestation_signature: string;        // min 3 characters (typed legal name)
  attestation_timestamp: string;        // ISO 8601 string
}
```

## Outputs
**200 OK:**
```json
{
  "success": true,
  "data": {
    "profileId": "8f3b2f56-6d60-4e2a-bb39-16a70eefdb6a",
    "status": "submitted",
    "submittedAt": "2026-09-03T22:35:00.000Z"
  }
}
```
**401 Unauthorized:**
```json
{ "success": false, "error": "Unauthorized" }
```
**404 Not Found:**
```json
{ "success": false, "error": "Application draft not found" }
```
**409 Conflict:**
```json
{ "success": false, "error": "Application has already been submitted" }
```
**422 Unprocessable Entity:**
```json
{
  "success": false,
  "error": "Validation failed",
  "fieldErrors": {
    "drug_screen_consent": ["Consent to drug screening is required"],
    "profile": ["Step 2 availability data is missing or incomplete"]
  }
}
```

## Acceptance Criteria
- [ ] Submitting with any required legal consent (`authorized_to_work_in_us`, `drug_screen_consent`, `background_check_consent`) set to `false` returns `422`.
- [ ] Submitting with `felony_conviction = true` and missing/empty `felony_explanation` returns `422`.
- [ ] Validates the assembled profile against `CompleteCaregiverApplicationSchema` before transitioning status.
- [ ] Updates `caregiver_profiles` setting `application_status = 'submitted'`, `application_step = 5`, `submitted_at = NOW()`, and `onboarding_checklist->application_form = 'submitted'`.
- [ ] Calls `sendApplicationSubmittedEmails` in a non-blocking `try/catch` block so SES issues do not fail the HTTP response.

## Do NOT
- Do NOT allow resubmitting an application that is already in `'submitted'`, `'under_review'`, or `'approved'` status.
- Do NOT block or return a 500 error to the client if AWS SES encounters an email delivery error.
- Do NOT allow bypassing prior step requirements — all previous step data must pass validation.
- Do NOT use Next.js server actions or direct Supabase client calls.
