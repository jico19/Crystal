# Task 07: Build DocumentUploadModal Component

**Spec:** `03-caregiver-documents-credential-tracking` | **Phase:** 3-Frontend | **Task:** 07

## Prerequisites
- task-02 `POST /api/v1/documents/upload-url` route deployed.
- task-03 `POST /api/v1/documents/:id/confirm` route deployed.
- task-06 `DocumentChecklistTable` exists and calls `onUploadClick`.
- `@crystal/ui` exports `Dialog`, `DialogContent`, `DialogHeader`, `Button`, `Input`, `Label`, `Alert`.
- `react-dropzone` (or native HTML file input) available.

## Context
The upload modal is triggered when a caregiver clicks "Upload" or "Re-upload" in the checklist table. It implements a two-phase upload: (1) the frontend requests a presigned PUT URL from the API, (2) the browser uploads the file directly to S3 using the signed URL, (3) the frontend calls the confirm endpoint to finalise the record. This three-step flow keeps AWS credentials server-side while allowing large files to bypass the API server.

## Stack & Files
- **Layer:** Vite React (per-state app)
- **Create:** `apps/georgia/src/components/documents/DocumentUploadModal.tsx` — modal with dropzone and upload logic
- **Create:** `apps/georgia/src/hooks/useDocumentUpload.ts` — hook encapsulating the three-step upload flow
- **Create:** `apps/indiana/src/components/documents/DocumentUploadModal.tsx` — identical modal for Indiana app

## Deliverable
A `DocumentUploadModal` React component (wrapping `@crystal/ui` `Dialog`) that: (1) renders a drag-and-drop dropzone accepting PDF, PNG, JPEG, HEIC up to 25 MB, (2) on file select shows a preview filename and size, (3) on submit calls `POST /api/v1/documents/upload-url`, (4) PUTs the file directly to the returned `uploadUrl` using `fetch` with the correct `Content-Type` header, (5) on S3 success calls `POST /api/v1/documents/:documentId/confirm`, (6) displays a progress bar during upload, and (7) shows success or error state on completion.

## Inputs
```typescript
// Component props
interface DocumentUploadModalProps {
  open: boolean;
  onClose: () => void;
  caregiverId: string;
  category: DocumentCategoryType;    // pre-selected from checklist row
  onSuccess: () => void;             // refetch the checklist after upload
}
```

## Outputs
- Modal with drag-and-drop zone, file preview, optional date fields (issue_date, expiration_date), `has_no_expiration` checkbox.
- Upload progress bar (0–100%).
- Success state: green checkmark + "Document submitted for review" message.
- Error state: red alert with message and retry button.

## Acceptance Criteria
- [ ] Files larger than 25 MB are rejected client-side before any API call, with an error message.
- [ ] Only `application/pdf`, `image/png`, `image/jpeg`, `image/heic` MIME types are accepted; others are rejected with an error.
- [ ] The file is PUT directly to the S3 presigned URL (not via the API) with the correct `Content-Type` header.
- [ ] If the S3 PUT fails (non-2xx), an error message is shown and the `caregiver_documents` row remains in `pending_upload`.
- [ ] On full success, `onSuccess()` is called to trigger checklist refetch and the modal closes.
- [ ] `has_no_expiration` checkbox disables and clears the `expiration_date` field when checked.

## Do NOT
- Do NOT store the file in component state beyond what is needed for the upload.
- Do NOT upload via the API server — the file must go directly to the S3 presigned URL.
- Do NOT use Next.js server actions, `'use server'`, or any Next.js imports.
- Do NOT implement document review UI (coordinator approval is out of scope for this component).
