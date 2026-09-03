# Task 08: Legal ESIGN Act Consent Checkbox
**Spec:** `09-esignature-workflow` | **Phase:** 3-Frontend | **Task:** 08

## Prerequisites
- [x] Task 06: Document signing container exists

## Context
Complies with US ESIGN / UETA federal requirements by displaying explicit legal consumer disclosure text and requiring a mandatory checkbox acknowledging intent to execute legally binding electronic records.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/components/esign/ConsentAttestationCheckbox.tsx`

## Deliverable
A legal disclosure checkbox component (`ConsentAttestationCheckbox.tsx`) rendering mandatory legal attestation text and modal trigger to review full ESIGN disclosures.

## Inputs
- Props: `{ checked: boolean, onChange: (checked: boolean) => void }`

## Outputs
- Boolean consent state passed to parent signing container

## Acceptance Criteria
- [ ] Displays exact federal ESIGN disclosure text
- [ ] Contains link/button to open full ESIGN disclosures modal
- [ ] Checkbox state controls parent form submission button enable/disable state

## Do NOT
- Do not pre-check the consent box — federal regulations require explicit user action
