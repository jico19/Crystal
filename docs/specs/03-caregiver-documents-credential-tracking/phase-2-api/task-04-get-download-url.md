# Task 04: Get Document Download URL

**Spec:** `03-caregiver-documents-credential-tracking` | **Phase:** 2-API | **Task:** 04

## Prerequisites
- task-01 DB schema applied.
- task-02 and task-03 documents module exists with `documents.router.ts`, `documents.service.ts`, `documents.repository.ts`.
- `verifyJWT` and `requireRole` middleware exist.
- AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) installed.

## Context
Documents are stored in a private S3 bucket — there are no public URLs. When a caregiver or coordinator needs to view or download a document, this endpoint validates ownership or role, writes an audit log entry (either `VIEW_PREVIEW` or `DOWNLOAD` based on query param), and returns a fresh 15-minute presigned GET URL. This ensures every file access is traceable.

## Stack & Files
- **Layer:** Express API
- **Modify:** `apps/api/src/modules/documents/documents.router.ts` — add `GET /:id/download-url` route
- **Modify:** `apps/api/src/modules/documents/documents.controller.ts` — add `getDownloadUrl` handler
- **Modify:** `apps/api/src/modules/documents/documents.service.ts` — add `generatePresignedGetUrl` function
- **Modify:** `apps/api/src/modules/documents/documents.repository.ts` — add `getDocumentById`, extend `insertAuditLog`

## Deliverable
An Express route `GET /api/v1/documents/:id/download-url` that authenticates via `verifyJWT`, fetches the document row, enforces ownership or `coordinator`/`admin`/`super_admin` role, writes a `VIEW_PREVIEW` or `DOWNLOAD` audit log entry based on `?intent=preview|download` query param (default `preview`), and returns `{ success: true, data: { downloadUrl, expiresAt } }`.

## Inputs
```typescript
// Route param
{ id: string }  // UUID of the caregiver_documents row

// Query param (optional)
{ intent?: 'preview' | 'download' }  // default: 'preview'

// Headers (populated by verifyJWT)
{ Authorization: 'Bearer <jwt>' }
```

## Outputs
**200 Success:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://s3.amazonaws.com/...",
    "expiresAt": "2026-09-03T23:55:00.000Z"
  }
}
```
**403 Forbidden:**
```json
{ "success": false, "error": "Access denied" }
```
**404 Not Found:**
```json
{ "success": false, "error": "Document not found" }
```

## Acceptance Criteria
- [ ] Caregiver requesting their own document's URL receives `200` with a presigned GET URL expiring in 900 seconds.
- [ ] Caregiver requesting another caregiver's document receives `403`.
- [ ] A `VIEW_PREVIEW` audit log entry is written when `intent=preview` (or default).
- [ ] A `DOWNLOAD` audit log entry is written when `intent=download`.
- [ ] The presigned URL points to the `file_storage_path` stored in `caregiver_documents`.
- [ ] Archived documents (`is_archived = true`) return `404` to prevent access.

## Do NOT
- Do NOT stream the file through the API server — return only the presigned URL.
- Do NOT skip the audit log write even for coordinator/admin access.
- Do NOT allow `intent` values other than `preview` or `download`.
- Do NOT create any frontend components or DB migrations.
