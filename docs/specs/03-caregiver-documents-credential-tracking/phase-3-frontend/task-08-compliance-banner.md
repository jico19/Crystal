# Task 08: Build ComplianceScoreBanner Component

**Spec:** `03-caregiver-documents-credential-tracking` | **Phase:** 3-Frontend | **Task:** 08

## Prerequisites
- task-06 `DocumentChecklistTable` exists and document fetching hook `useCaregiversDocuments` is implemented.
- `@crystal/ui` exports `Card`, `Progress`, `Badge`, `Button`, `Skeleton`.
- `@crystal/types` exports `CaregiverDocument`, `DocumentCategoryType`, `DocVerificationStatusType`.
- React Router v7 installed; app lives in `apps/georgia/src/` and `apps/indiana/src/`.

## Context
The compliance score banner is positioned at the top of the caregiver documents portal to provide an immediate visual gauge of credential readiness. It calculates the overall compliance percentage based on how many of the 11 mandatory document categories have an `approved` status, surfacing counts of expiring, rejected, or missing documents. This Vite SPA component fetches document states through the Express API hook (`GET /api/v1/documents?caregiver_id=:id`) and updates reactively as documents are uploaded and approved.

## Stack & Files
- **Layer:** Vite React (per-state app)
- **Create:** `apps/georgia/src/components/documents/ComplianceScoreBanner.tsx` — compliance score card with progress bar, status counters, and alerts
- **Create:** `apps/indiana/src/components/documents/ComplianceScoreBanner.tsx` — identical component for Indiana app

## Deliverable
A `ComplianceScoreBanner` React component that accepts `documents: CaregiverDocument[]` and `isLoading?: boolean`, calculates overall compliance percentage as `(approved_count / 11) * 100`, renders a colour-coded progress bar (green for 100%, amber for 70–99%, red for < 70%), displays counts for Approved, Expiring Soon (< 30 days), and Action Needed (rejected or missing), and presents a contextual message prompting the caregiver to upload outstanding credentials.

## Inputs
```typescript
// Component props
interface ComplianceScoreBannerProps {
  documents: CaregiverDocument[];
  isLoading?: boolean;
  onUploadClick?: (category: DocumentCategoryType) => void;
}
```

## Outputs
- A responsive hero card displaying:
  - Compliance headline (e.g. "82% Compliant — 9 of 11 Documents Approved").
  - Visual progress bar reflecting the calculated percentage (0–100%).
  - Three summary pill badges: Approved count (green), Expiring Soon count (amber), and Missing/Rejected count (red).
  - Contextual banner alert when urgent renewals (expiring in <= 30 days) or rejected documents require caregiver attention.
  - Skeleton placeholder during `isLoading = true`.

## Acceptance Criteria
- [ ] Calculates percentage score accurately as `(approved_unique_categories / 11) * 100`, capped at 100%.
- [ ] Color-codes the progress bar dynamically: green (`bg-emerald-600`) when 100%, amber (`bg-amber-500`) when 70–99%, and red (`bg-rose-500`) when < 70%.
- [ ] Identifies approved documents with `expiration_date` within 30 days and displays an "Expiring Soon" count badge.
- [ ] Identifies any rejected documents and displays an "Action Needed: Document Rejected" call-to-action badge.
- [ ] Renders loading skeleton elements when `isLoading` prop is true.
- [ ] Does not make direct Supabase calls; consumes document data exclusively from component props or Express API hook.

## Do NOT
- Do NOT implement file upload modals inside this component (delegate action to task-07 `DocumentUploadModal` via `onUploadClick`).
- Do NOT fetch data directly from Supabase — all data flows through Express API `GET /api/v1/documents`.
- Do NOT hardcode document category names; reference `DocumentCategoryType` from `@crystal/types`.
- Do NOT use Next.js server actions, `'use client'`, or Next.js layout patterns.
