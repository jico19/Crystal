# Task 03: Confirm Document Upload

**Spec:** `03-caregiver-documents-credential-tracking` | **Phase:** 2-API | **Task:** 03

## Prerequisites
- task-01 DB schema applied.
- task-02 documents module scaffolded (`documents.router.ts`, `documents.controller.ts`, `documents.service.ts`, `documents.repository.ts`).
- `verifyJWT` middleware exists.

## Context
After the browser successfully PUTs the file to S3, it calls this endpoint to signal completion. The API verifies the document row belongs to the authenticated caregiver, updates its status from `pending_upload` to `under_review`, persists file metadata, and writes the first immutable `UPLOAD` audit log entry. This two-step flow (presign → confirm) prevents orphaned `under_review` rows for failed uploads.

## Stack & Files
- **Layer:** Express API
- **Modify:** `apps/api/src/modules/documents/documents.router.ts` — add `POST /:id/confirm` route
- **Modify:** `apps/api/src/modules/documents/documents.controller.ts` — add `confirmUpload` handler
- **Modify:** `apps/api/src/modules/documents/documents.service.ts` — add `confirmDocumentUpload` function
- **Modify:** `apps/api/src/modules/documents/documents.repository.ts` — add `updateDocumentStatus`, `insertAuditLog` functions

## Deliverable
An Express route `POST /api/v1/documents/:id/confirm` that authenticates the requester via `verifyJWT`, verifies the `caregiver_documents` row belongs to the caregiver (or requester is coordinator+), sets `verification_status = 'under_review'`, stores finalised metadata, inserts an `UPLOAD` entry into `document_audit_logs`, and returns `{ success: true, data: { documentId, status: 'under_review' } }`.

## Inputs
```typescript
// Route param
{ id: string }  // UUID of the caregiver_documents row

// Request body
{
  file_size_bytes: number;   // actual bytes uploaded (for final record)
  ip_address?: string;       // forwarded from X-Forwarded-For header
  user_agent?: string;       // from request User-Agent header
}
```

## Outputs
**200 Success:**
```json
{
  "success": true,
  "data": {
    "documentId": "uuid-v4",
    "status": "under_review"
  }
}
```
**404 Not Found:**
```json
{ "success": false, "error": "Document not found" }
```
**409 Conflict:**
```json
{ "success": false, "error": "Document already confirmed" }
```
**401 Unauthorized:**
```json
{ "success": false, "error": "Unauthorized" }
```

## Acceptance Criteria
- [ ] Only the owning caregiver or a coordinator/admin can confirm an upload; all other requesters receive `403`.
- [ ] Calling confirm on a document not in `pending_upload` status returns `409 Conflict`.
- [ ] After a successful confirm, `verification_status` in `caregiver_documents` is `under_review`.
- [ ] An entry with `action = 'UPLOAD'` is inserted into `document_audit_logs` with the correct `document_id` and `user_id`.
- [ ] The `ip_address` and `user_agent` from the request are stored in the audit log row.

## Do NOT
- Do NOT re-check S3 to verify the file actually exists (trust the client; S3 lifecycle handles cleanup).
- Do NOT trigger OCR from this route — that is the responsibility of `Agent-DocOCR`.
- Do NOT create any frontend components or new DB migrations.
- Do NOT change `verification_status` to anything other than `under_review` in this route.
