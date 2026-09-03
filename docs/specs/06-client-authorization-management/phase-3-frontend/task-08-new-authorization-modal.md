# Task 08: New Authorization Modal Form
**Spec:** `06-client-authorization-management` | **Phase:** 3-Frontend | **Task:** 08

## Prerequisites
- [x] Task 02: `POST /api/v1/authorizations` API route exists
- [x] `@crystal/validation` exports `ClientAuthorizationSchema`

## Context
Coordinators enter new prior authorization details or record a renewal notice approved by Medicaid. This modal dialog contains the form fields and posts to the API.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/components/authorizations/NewAuthorizationModal.tsx`

## Deliverable
A dialog modal component (`NewAuthorizationModal.tsx`) using React Hook Form + Zod schema validation to create an authorization record, invalidating authorization queries upon success.

## Inputs
- Props: `{ open: boolean, onOpenChange: (open: boolean) => void, defaultClientId?: string }`

## Outputs
- API Call: `POST /api/v1/authorizations`
- Refreshes roster list on success

## Acceptance Criteria
- [ ] Client dropdown selects active client (pre-selected if `defaultClientId` passed)
- [ ] Validates `end_date` is after `start_date` client-side before submit
- [ ] Inputs procedure code, payer name, total authorized units, and weekly hours cap
- [ ] Closes modal and triggers toast notification on 201 Created response

## Do NOT
- Do not allow submitting without selecting a valid client
