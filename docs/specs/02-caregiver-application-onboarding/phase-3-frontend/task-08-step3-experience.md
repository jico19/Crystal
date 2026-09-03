# Task 08: Step 3 Experience & References Form Component
**Spec:** `02-caregiver-application-onboarding` | **Phase:** 3-Frontend | **Task:** 08

## Prerequisites
- [x] Task 05: Wizard shell layout exists
- [x] `@crystal/validation` exports `ExperienceStepSchema`

## Context
Step 3 collects previous healthcare employment history (employer, title, start/end dates, reason for leaving) and at least 2 professional/personal references.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/components/caregivers/steps/Step3ExperienceReferences.tsx`

## Deliverable
A React form component (`Step3ExperienceReferences.tsx`) using React Hook Form `useFieldArray` to render dynamic repeater rows for work experience entries and reference contacts.

## Inputs
- Form state initialized from draft profile

## Outputs
- API Call: `PUT /api/v1/caregivers/application/draft` with `{ step: 3, experience: ... }`

## Acceptance Criteria
- [ ] Allows dynamically adding and removing work history rows
- [ ] Enforces adding at least 2 reference contacts with valid phone numbers
- [ ] Validates start/end date format (YYYY-MM-DD)
- [ ] Advances to Step 4 upon successful save

## Do NOT
- Do not allow proceeding without at least 2 references
