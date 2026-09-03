# Task 05: Get Training Certificate PDF Express Route
**Spec:** `04-in-service-training-portal` | **Phase:** 2-API | **Task:** 05

## Prerequisites
- [x] Task 04: `POST /courses/:id/quiz` route exists

## Context
Caregivers and state agency auditors download or print official training completion certificates featuring the caregiver name, module title, state CEU hours earned, and SHA-256 verification seal.

## Stack & Files
- **Layer:** Express API
- **Modify:** `apps/api/src/modules/training/training.router.ts` — mount `GET /certificates/:id`
- **Modify:** `apps/api/src/modules/training/training.controller.ts`

## Deliverable
An Express route `GET /api/v1/training/certificates/:id` verifying authorization (caregiver ownership or staff role), rendering or fetching the certificate PDF from S3, and returning a 15-minute presigned download URL.

## Inputs
- Route param: `:id` (Certificate/Progress Record UUID)

## Outputs
- `200 OK`: `{ success: true, data: { downloadUrl: string, certificateHash: string } }`

## Acceptance Criteria
- [ ] Returns 200 with presigned download URL if user is authorized
- [ ] Verifies caregiver has passed the module before issuing download URL
- [ ] Includes SHA-256 cryptographic verification hash in response metadata

## Do NOT
- Do not issue certificates for unpassed or incomplete training modules
