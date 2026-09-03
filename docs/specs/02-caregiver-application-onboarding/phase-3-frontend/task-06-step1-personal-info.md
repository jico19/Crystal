# Task 06: Step 1 Personal Info Form Component
**Spec:** `02-caregiver-application-onboarding` | **Phase:** 3-Frontend | **Task:** 06

## Prerequisites
- [x] Task 05: Wizard shell layout exists
- [x] `@crystal/validation` exports `PersonalInfoStepSchema`

## Context
Step 1 of the caregiver onboarding wizard collects full legal name, contact phone, email, date of birth (with 18+ age validation), masked SSN input (`***-**-1234`), and physical address.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/components/caregivers/steps/Step1PersonalInfo.tsx`

## Deliverable
A React form component (`Step1PersonalInfo.tsx`) using React Hook Form + Zod schema validation to collect applicant personal details, mask SSN as user types, validate age >= 18, and trigger `POST /api/v1/caregivers/application` on step advance.

## Inputs
- Form state initialized from existing draft profile (if resuming draft)

## Outputs
- API Call: `POST /api/v1/caregivers/application` (or `PUT /draft`)
- Advances wizard to Step 2 upon success

## Acceptance Criteria
- [ ] SSN field displays masked format (`***-**-6789`) when displaying saved draft
- [ ] DOB field blocks progression if applicant age is less than 18
- [ ] Street address, city, state, and ZIP inputs validated with Zod
- [ ] Advances to Step 2 upon successful server response

## Do NOT
- Do not transmit unmasked SSNs in error logs or query parameters
