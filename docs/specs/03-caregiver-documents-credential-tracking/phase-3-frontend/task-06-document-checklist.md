# Task 06: Build DocumentChecklistTable Component

**Spec:** `03-caregiver-documents-credential-tracking` | **Phase:** 3-Frontend | **Task:** 06

## Prerequisites
- task-02 through task-05 API routes deployed and accessible.
- `@crystal/ui` component library available (shadcn/ui components: `Badge`, `Card`, `Button`, `Skeleton`).
- `@crystal/types` exports `CaregiverDocument`, `DocumentCategoryType`, `DocVerificationStatusType`.
- React Router v7 installed; the caregiver portal lives in `apps/georgia/src/` or `apps/indiana/src/`.

## Context
The checklist table is the primary UI surface for credential compliance. It displays one row per required document category showing the current upload status, expiry date, and a contextual action button (Upload, Re-upload, or View). This component fetches document data from the Express API (not Supabase directly) and renders status badges with colour coding so caregivers and coordinators can immediately spot gaps.

## Stack & Files
- **Layer:** Vite React (per-state app)
- **Create:** `apps/georgia/src/components/documents/DocumentChecklistTable.tsx` — main checklist component
- **Create:** `apps/georgia/src/hooks/useCaregiversDocuments.ts` — custom hook: `GET /api/v1/documents?caregiver_id=:id` fetch with loading/error state
- **Create:** `apps/indiana/src/components/documents/DocumentChecklistTable.tsx` — identical component for Indiana app

## Deliverable
A `DocumentChecklistTable` React component that accepts `caregiverId: string` as a prop, fetches the caregiver's documents from `GET /api/v1/documents?caregiver_id=:id`, renders a row for each of the 11 required `DocumentCategoryType` values, shows a colour-coded `Badge` for each status (`pending_upload` = grey, `under_review` = yellow, `approved` = green, `rejected` = red, `expired` = orange), displays the expiry date or "No Expiration" when `has_no_expiration = true`, and renders an "Upload" button for missing categories and a "Re-upload" button for rejected/expired ones.

## Inputs
```typescript
// Component props
interface DocumentChecklistTableProps {
  caregiverId: string;       // UUID of the caregiver whose documents to display
  onUploadClick: (category: DocumentCategoryType) => void;  // opens DocumentUploadModal
}
```

## Outputs
- Renders a table/card list with one row per document category.
- Each row: category label, status badge, expiry date (or "No Expiration" / "N/A"), action button.
- Shows skeleton loaders while fetching.
- Shows an inline error alert if the fetch fails.

## Acceptance Criteria
- [ ] All 11 document category types are rendered as rows even if no document has been uploaded yet (shows "Not Uploaded" / grey badge).
- [ ] Status badges use the correct colour per status as described above.
- [ ] `onUploadClick(category)` is called with the correct category when the Upload or Re-upload button is clicked.
- [ ] Skeleton rows are shown during the loading state.
- [ ] The component does NOT directly call Supabase — all data comes through `fetch('/api/v1/documents?caregiver_id=...')`.

## Do NOT
- Do NOT implement the upload modal inside this component (that is task-07).
- Do NOT hard-code document data — all data must come from the API hook.
- Do NOT use Next.js `'use client'`, App Router, or server actions.
- Do NOT implement the compliance score banner (that is task-08).
