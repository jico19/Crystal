# Task 06: Document Signing Container Component
**Spec:** `09-esignature-workflow` | **Phase:** 3-Frontend | **Task:** 06

## Prerequisites
- [x] Task 05: `GET /api/v1/esign/envelopes/:id` route exists
- [x] Task 03: `POST /api/v1/esign/envelopes/:id/sign` route exists

## Context
Renders the legal document viewer interface where signers read agreement terms, view signature anchor zones, draw or type their signature, accept legal disclosures, and execute the packet.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/pages/esign/DocumentSigningPage.tsx`
- **Create:** `apps/georgia/src/components/esign/DocumentSigningContainer.tsx`

## Deliverable
A document viewing and signing page (`DocumentSigningPage.tsx`) rendering the agreement PDF preview, signature canvas trigger, ESIGN Act consent checkbox, and completion action button.

## Inputs
- Route parameter `:envelopeId`

## Outputs
- API Call: `POST /api/v1/esign/envelopes/:id/sign`
- Renders completion confirmation with SHA-256 stamp badge on success

## Acceptance Criteria
- [ ] Loads envelope metadata and document preview
- [ ] Enforces reading agreement text before allowing signature execution
- [ ] Submit button remains disabled until signature is drawn and ESIGN consent checkbox is checked
- [ ] Displays loading spinner during signing submission

## Do NOT
- Do not bypass client-side validation of signature pad content
