# Task 08: Client Intake Wizard Form Component
**Spec:** `05-client-intake-documents` | **Phase:** 3-Frontend | **Task:** 08

## Prerequisites
- [x] Task 02: `POST /api/v1/clients/intake` Express route exists
- [x] `@crystal/validation` exports `ClientIntakeFormSchema`

## Context
Coordinators register new client intake applications. The form collects demographics, primary service address, emergency contacts (with POA indicator), primary physician details, care needs (ADLs/IADLs), and payer information (Medicaid / Private Pay / VA).

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/pages/admin/clients/ClientIntakePage.tsx`
- **Create:** `apps/georgia/src/components/clients/ClientIntakeForm.tsx`
- **Create:** `apps/georgia/src/components/clients/EmergencyContactsRepeater.tsx`

## Deliverable
A multi-section form component (`ClientIntakeForm.tsx`) managed by React Hook Form and Zod validation that posts payload to `POST /api/v1/clients/intake` and navigates to the client's new profile page upon success.

## Inputs
- Form fields: Demographics, Phone, Address, Emergency Contacts array, Physician info, Payer select (Medicaid Waiver, Private Pay, VA, Commercial), Medicaid ID (conditionally required).

## Outputs
- API Call: `POST /api/v1/clients/intake`
- On Success: Toast notification + redirect to `/admin/clients/:id`

## Acceptance Criteria
- [ ] Zod client-side validation displays inline field errors before submitting
- [ ] Medicaid ID input is required when Payer Type is `medicaid_waiver`
- [ ] Emergency contacts section allows adding/removing multiple contact cards
- [ ] Primary emergency contact toggle enforces exactly one primary contact
- [ ] Form submit button disables with spinner during API request

## Do NOT
- Do not make direct Supabase calls — call the Express API `/api/v1/clients/intake` endpoint
- Do not handle document uploads in this form — document ingestion happens in Task 09
