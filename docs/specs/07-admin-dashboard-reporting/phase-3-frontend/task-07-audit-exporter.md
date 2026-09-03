# Task 07: Compliance Audit Exporter Component
**Spec:** `07-admin-dashboard-reporting` | **Phase:** 3-Frontend | **Task:** 07

## Prerequisites
- [x] Task 03: `GET /api/v1/reports/export` Express route exists

## Context
When state regulatory surveyors (Georgia DCH or Indiana FSSA) inspect the agency, staff use this exporter to generate a 1-click audit compliance CSV packet.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/components/admin/ComplianceAuditExporter.tsx`

## Deliverable
A button & modal component (`ComplianceAuditExporter.tsx`) allowing admins to select target state agency (`Georgia` or `Indiana`) and export format (`CSV` or `PDF`), triggering file download from `GET /api/v1/reports/export`.

## Inputs
- State selection, Date range, Report format (`CSV` / `PDF`)

## Outputs
- Triggered browser file download (`crystal_compliance_audit_GA_2026-09-03.csv`)

## Acceptance Criteria
- [ ] Opens dialog with state picker and export options
- [ ] Button disables with loading spinner while file stream is preparing
- [ ] Triggers native browser download upon binary payload stream response
- [ ] Displays success notification once download completes

## Do NOT
- Do not generate CSVs client-side — backend API route handles stream generation securely
