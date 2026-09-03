# Task 02: Build POST /api/v1/caregivers/application Route (Create Draft)

**Spec:** `02-caregiver-application-onboarding` | **Phase:** 2-API | **Task:** 02

## Prerequisites
- Task 01 complete: `caregiver_profiles` table, enums, and RLS policies created.
- Auth middleware available at `apps/api/src/middleware/auth.middleware.ts` (`verifyJWT`).
- `@crystal/validation` exports `PersonalInfoStepSchema`.
- Express application router mounted at `/api/v1` in `apps/api/src/app.ts`.

## Context
When a prospective caregiver finishes Step 1 (Personal Information) of the onboarding wizard, this route creates their initial draft profile in PostgreSQL. The route authenticates the candidate via Bearer JWT, validates their personal information (enforcing 18+ minimum age), securely isolates the last 4 digits of the SSN while stripping the raw SSN from persistence, and creates or updates a record in `caregiver_profiles` with `application_status = 'draft'` and `application_step = 1`. This establishes a persistent server draft so the applicant can resume later without data loss.

## Stack & Files
- **Layer:** Express API
- **Create:** `apps/api/src/modules/caregivers/caregivers.router.ts` — router definition mounting `POST /application`
- **Create:** `apps/api/src/modules/caregivers/caregivers.controller.ts` — `createApplicationDraft` controller method
- **Create:** `apps/api/src/modules/caregivers/caregivers.service.ts` — `createOrUpdateDraftProfile` business logic (SSN sanitization, age verification)
- **Create:** `apps/api/src/modules/caregivers/caregivers.repository.ts` — SQL query inserting or upserting `caregiver_profiles`
- **Create:** `apps/api/src/modules/caregivers/caregivers.schema.ts` — re-exports `PersonalInfoStepSchema` and defines `CreateDraftApplicationSchema`
- **Modify:** `apps/api/src/app.ts` — mount `caregiversRouter` at `/api/v1/caregivers`

## Deliverable
An Express route `POST /api/v1/caregivers/application` protected by `verifyJWT` that validates Step 1 personal data with Zod, strips raw SSN while retaining `ssn_last4`, creates or upserts a row in `caregiver_profiles` with `status = 'draft'`, and returns `{ success: true, data: { profileId, applicationStep: 1 } }`.

## Inputs
```typescript
// Headers: Authorization: Bearer <jwt>
// Body — validated against CreateDraftApplicationSchema:
{
  org_id: string;          // UUID matching tenant organization
  state_code: "GA" | "IN" | "FL";
  personal_info: {
    first_name: string;    // min 2, max 50
    middle_name?: string;  // max 50
    last_name: string;     // min 2, max 50
    email: string;         // valid email
    phone: string;         // US phone regex
    dob: string;           // YYYY-MM-DD; must be at least 18 years old
    ssn: string;           // regex /^\d{3}-?\d{2}-?\d{4}$/
    address: {
      street: string;      // min 3
      unit?: string;
      city: string;        // min 2
      state: string;       // length 2
      zip: string;         // 5 or 9 digit regex
    };
  };
}
```

## Outputs
**201 Created (or 200 OK on upsert):**
```json
{
  "success": true,
  "data": {
    "profileId": "8f3b2f56-6d60-4e2a-bb39-16a70eefdb6a",
    "applicationStatus": "draft",
    "applicationStep": 1
  }
}
```
**401 Unauthorized:**
```json
{ "success": false, "error": "Missing or invalid Bearer authentication token" }
```
**422 Unprocessable Entity (Validation Error):**
```json
{
  "success": false,
  "error": "Validation failed",
  "fieldErrors": {
    "personal_info.dob": ["Applicant must be at least 18 years old"],
    "personal_info.ssn": ["Valid 9-digit SSN required"]
  }
}
```
**500 Internal Server Error:**
```json
{ "success": false, "error": "Failed to create caregiver application profile" }
```

## Acceptance Criteria
- [ ] Requests without a valid Bearer JWT return `401 Unauthorized`.
- [ ] Submitting a DOB representing an age under 18 returns `422` with "Applicant must be at least 18 years old".
- [ ] The raw `ssn` field is never persisted; the DB column `personal_info` contains `ssn_last4` (e.g. `'1234'`) and no `ssn` key.
- [ ] Creates a row in `caregiver_profiles` with `user_id = req.user.id`, `application_status = 'draft'`, and `application_step = 1`.
- [ ] Calling the endpoint repeatedly with the same authenticated `user_id` idempotently updates the existing draft rather than throwing a duplicate key error.

## Do NOT
- Do NOT store plain-text SSN in any database column or log output.
- Do NOT set `application_status = 'submitted'` in this route.
- Do NOT validate or require Step 2 through Step 5 fields in this endpoint.
- Do NOT use Next.js server actions or direct Supabase client calls.
