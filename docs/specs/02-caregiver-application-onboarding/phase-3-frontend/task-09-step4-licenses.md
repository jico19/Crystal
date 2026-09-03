# Task 09: Step 4 Professional Licenses Form Component
**Spec:** `02-caregiver-application-onboarding` | **Phase:** 3-Frontend | **Task:** 09

## Prerequisites
- [x] Task 05: Wizard shell layout exists
- [x] `@crystal/validation` exports `LicensesStepSchema`

## Context
Step 4 collects active state certifications and licenses (CNA, HHA, LPN, RN, CPR/First Aid) including license number, issuing state, and expiration date.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/components/caregivers/steps/Step4Licenses.tsx`

## Deliverable
A React form component (`Step4Licenses.tsx`) rendering license cards with license type dropdowns, license number inputs, and expiration date pickers.

## Inputs
- Form state initialized from draft profile

## Outputs
- API Call: `PUT /api/v1/caregivers/application/draft` with `{ step: 4, licenses: ... }`

## Acceptance Criteria
- [ ] Allows adding multiple professional licenses or checking "No active licenses held"
- [ ] License expiration date picker enforces valid future date
- [ ] Advances to Step 5 upon successful save

## Do NOT
- Do not allow saving an expired license without warning indicator
