# Task 09: Client 360 Profile Page & Document Vault
**Spec:** `05-client-intake-documents` | **Phase:** 3-Frontend | **Task:** 09

## Prerequisites
- [x] Task 04: `GET /api/v1/clients/:id` route exists
- [x] Task 05: `PUT /api/v1/clients/:id/status` route exists
- [x] Task 06: `POST /api/v1/clients/:id/documents/upload-url` route exists

## Context
Staff navigate to a client's 360-degree profile to review care plans, emergency contacts, payer status, uploaded clinical documents (Form 485s, RN assessments), and transition client status (`inquiry` -> `intake_pending` -> `active` -> `discharged`).

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/pages/admin/clients/ClientProfilePage.tsx`
- **Create:** `apps/georgia/src/components/clients/CarePlanCard.tsx`
- **Create:** `apps/georgia/src/components/clients/ClientDocumentVault.tsx`
- **Create:** `apps/georgia/src/components/clients/ClientStatusTransitionModal.tsx`

## Deliverable
A tabbed client profile page component rendering client header details, `CarePlanCard.tsx` (ADLs/diagnoses), `ClientDocumentVault.tsx` (upload & preview clinical PDFs via presigned URLs), and status transition dropdown modal.

## Inputs
- Route parameter: `:clientId`
- Data fetched from: `GET /api/v1/clients/:id`

## Outputs
- Status update API call: `PUT /api/v1/clients/:id/status`
- Document upload API call: `POST /api/v1/clients/:id/documents/upload-url`

## Acceptance Criteria
- [ ] Profile header displays Client Name, DOB, Status Badge, State, and Primary Payer
- [ ] `CarePlanCard` lists ADL/IADL assistance needs, allergies, and primary physician contact
- [ ] `ClientDocumentVault` displays list of uploaded documents with download/preview triggers
- [ ] "Upload Document" button opens modal to select doc category and file, uploading to S3
- [ ] Status transition modal prompts for confirmation before updating client status

## Do NOT
- Do not build prior authorization unit burn-down meters in this task — that is Spec 06
- Do not allow unauthenticated or unauthorized users to view client profile data
