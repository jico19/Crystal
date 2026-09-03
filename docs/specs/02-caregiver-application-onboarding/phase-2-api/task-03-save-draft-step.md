# Task 03: Build PUT /api/v1/caregivers/application/draft Route (Save Step Progress)

**Spec:** `02-caregiver-application-onboarding` | **Phase:** 2-API | **Task:** 03

## Prerequisites
- Task 01 complete: `caregiver_profiles` table exists with JSONB fields.
- Task 02 complete: `caregivers` module created with router, controller, service, repository, and mounted at `/api/v1/caregivers`.
- Auth middleware (`verifyJWT`) operational.
- `@crystal/validation` exports `AvailabilityStepSchema`, `ExperienceStepSchema`, and `LicensesStepSchema`.

## Context
As an applicant progresses through Steps 2, 3, and 4 (Availability, Experience/References, Licensure), their progress is saved either incrementally via debounced auto-save or upon clicking "Continue". This endpoint accepts the step identifier and step-specific data payload, validates it against the appropriate step schema, updates the corresponding columns and `application_step` in `caregiver_profiles` for the authenticated `req.user.id`, and returns the updated step progress. This endpoint only permits updating draft applications.

## Stack & Files
- **Layer:** Express API
- **Modify:** `apps/api/src/modules/caregivers/caregivers.router.ts` — add `PUT /application/draft` route with `verifyJWT`
- **Modify:** `apps/api/src/modules/caregivers/caregivers.controller.ts` — add `saveDraftStep` handler
- **Modify:** `apps/api/src/modules/caregivers/caregivers.service.ts` — add `updateDraftStep` logic validating step data and enforcing draft status
- **Modify:** `apps/api/src/modules/caregivers/caregivers.repository.ts` — add `updateStepData` query targeting specific JSONB columns
- **Modify:** `apps/api/src/modules/caregivers/caregivers.schema.ts` — add discriminated union schema `SaveDraftStepSchema`

## Deliverable
An Express route `PUT /api/v1/caregivers/application/draft` that authenticates via `verifyJWT`, validates step-specific data for Step 2, 3, or 4 against its corresponding Zod schema, updates the appropriate columns in `caregiver_profiles` for the authenticated applicant, and returns `{ success: true, data: { profileId, applicationStep } }`.

## Inputs
```typescript
// Headers: Authorization: Bearer <jwt>
// Body — discriminated union on "step" (2 | 3 | 4):
type SaveDraftStepInput =
  | {
      step: 2;
      data: {
        positions_applied: Array<'cna' | 'hha' | 'companion' | 'pca' | 'rn' | 'lpn'>;
        availability: {
          full_time: boolean;
          part_time: boolean;
          prn: boolean;
          days_available: Array<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'>;
          shifts_available: Array<'mornings' | 'afternoons' | 'evenings' | 'overnights' | 'live_in'>;
          max_weekly_hours: number;
          willing_to_travel_miles: number;
        };
      };
    }
  | {
      step: 3;
      data: {
        experience_history: Array<{
          employer_name: string;
          job_title: string;
          start_date: string; // YYYY-MM-DD
          end_date?: string;   // YYYY-MM-DD
          reason_for_leaving?: string;
          supervisor_contact?: string;
        }>;
        references: Array<{
          name: string;
          relationship: 'professional' | 'personal' | 'supervisor';
          phone: string;
          email?: string;
          years_known: number;
        }>; // min 2
      };
    }
  | {
      step: 4;
      data: {
        professional_licenses: Array<{
          license_type: 'CNA' | 'HHA' | 'LPN' | 'RN' | 'CPR' | 'PCA';
          license_number: string;
          issuing_state: string; // 2 letters
          expiration_date: string; // YYYY-MM-DD
        }>;
      };
    };
```

## Outputs
**200 OK:**
```json
{
  "success": true,
  "data": {
    "profileId": "8f3b2f56-6d60-4e2a-bb39-16a70eefdb6a",
    "applicationStep": 3,
    "updatedAt": "2026-09-03T22:30:00.000Z"
  }
}
```
**401 Unauthorized:**
```json
{ "success": false, "error": "Unauthorized" }
```
**404 Not Found:**
```json
{ "success": false, "error": "Application draft not found. Complete Step 1 first." }
```
**409 Conflict:**
```json
{ "success": false, "error": "Application has already been submitted and cannot be modified" }
```
**422 Unprocessable Entity:**
```json
{
  "success": false,
  "error": "Validation failed",
  "fieldErrors": { "data.references": ["At least 2 references are required"] }
}
```

## Acceptance Criteria
- [ ] Passing `step: 2` updates both `positions_applied` and `availability` columns, setting `application_step = 2`.
- [ ] Passing `step: 3` validates minimum 1 work history and minimum 2 references, updating `experience_history` and `references`.
- [ ] Passing `step: 4` updates `professional_licenses` and sets `application_step = 4` (allows empty array `[]` for unlicensed applicants).
- [ ] Returns `404` if no row exists in `caregiver_profiles` for the authenticated `req.user.id`.
- [ ] Returns `409` if the profile's `application_status` is not `'draft'`.

## Do NOT
- Do NOT alter `application_status` to `'submitted'` in this route.
- Do NOT allow updating another user's profile row — query must filter strictly by `user_id = req.user.id`.
- Do NOT require Step 3 or 4 data when submitting Step 2.
- Do NOT perform direct database mutations from outside the `caregivers.repository.ts`.
