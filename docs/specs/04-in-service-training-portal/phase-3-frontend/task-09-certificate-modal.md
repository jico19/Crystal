# Task 09: Training Certificate Modal Component
**Spec:** `04-in-service-training-portal` | **Phase:** 3-Frontend | **Task:** 09

## Prerequisites
- [x] Task 05: `GET /api/v1/training/certificates/:id` API route exists

## Context
Displays an official, verifiable training completion certificate modal showing caregiver name, module title, CEU credit hours earned, completion date, and SHA-256 verification hash seal.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/components/training/CertificateModal.tsx`

## Deliverable
A certificate viewer modal component (`CertificateModal.tsx`) fetching presigned PDF download URL from `GET /api/v1/training/certificates/:id`, rendering an inline PDF preview, and providing "Download PDF" and "Print Certificate" buttons.

## Inputs
- Props: `{ progressId: string, open: boolean, onOpenChange: (open: boolean) => void }`

## Outputs
- Rendered certificate preview modal with download & print triggers

## Acceptance Criteria
- [ ] Displays inline preview frame of the certificate PDF
- [ ] Includes SHA-256 cryptographic verification hash badge
- [ ] "Download PDF" button triggers native browser download
- [ ] "Print Certificate" button opens browser print dialog

## Do NOT
- Do not render unstyled certificates — format cleanly matching agency branding standards
