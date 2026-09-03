# Task 07: Step 2 Availability & Roles Form Component
**Spec:** `02-caregiver-application-onboarding` | **Phase:** 3-Frontend | **Task:** 07

## Prerequisites
- [x] Task 05: Wizard shell layout exists
- [x] `@crystal/validation` exports `AvailabilityStepSchema`

## Context
Step 2 collects target job positions (`CNA`, `HHA`, `Companion`, `PCA`, `RN`, `LPN`), shift availability (mornings, afternoons, evenings, overnights, live-in), available work days, max weekly hours, and travel radius.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/components/caregivers/steps/Step2Availability.tsx`

## Deliverable
A React form component (`Step2Availability.tsx`) rendering position selection cards, shift checkboxes, travel radius slider (5–100 miles), and auto-saving progress via `PUT /api/v1/caregivers/application/draft`.

## Inputs
- Form state initialized from draft profile

## Outputs
- API Call: `PUT /api/v1/caregivers/application/draft` with `{ step: 2, availability: ... }`

## Acceptance Criteria
- [ ] Position selection requires picking at least 1 role (CNA, HHA, PCA, etc.)
- [ ] Shift checkboxes allow selecting multiple shift preferences
- [ ] Travel radius slider defaults to 25 miles
- [ ] Advances to Step 3 upon successful save

## Do NOT
- Do not allow proceeding without selecting at least one position and available day
