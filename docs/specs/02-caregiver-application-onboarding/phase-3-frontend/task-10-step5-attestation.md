# Task 10: Step 5 Legal Disclosures & Attestation Form Component
**Spec:** `02-caregiver-application-onboarding` | **Phase:** 3-Frontend | **Task:** 10

## Prerequisites
- [x] Task 05: Wizard shell layout exists
- [x] Task 04: `POST /api/v1/caregivers/application/submit` API route exists
- [x] `@crystal/validation` exports `LegalDisclosuresStepSchema`

## Context
Step 5 presents mandatory legal disclosures (US work authorization, criminal history disclosure, drug screen consent, background check consent) and requires typing full legal name as a digital attestation signature.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/components/caregivers/steps/Step5Attestation.tsx`

## Deliverable
A React form component (`Step5Attestation.tsx`) rendering disclosure consent checkboxes, typed signature input, attestation date timestamp, and "Submit Application" button calling `POST /api/v1/caregivers/application/submit`.

## Inputs
- Form state initialized from draft profile

## Outputs
- API Call: `POST /api/v1/caregivers/application/submit`
- Redirects to onboarding status dashboard upon 200 OK response

## Acceptance Criteria
- [ ] Mandatory consent checkboxes (US work auth, drug screen, background check) must be checked
- [ ] Typed attestation signature must match legal full name
- [ ] Submit button disables with loading spinner while submission request executes
- [ ] Navigates to `/caregiver/onboarding` dashboard upon successful submission

## Do NOT
- Do not submit without background check consent checked
