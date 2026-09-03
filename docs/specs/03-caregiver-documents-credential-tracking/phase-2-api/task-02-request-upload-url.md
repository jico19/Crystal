# Task 02: Request Presigned Upload URL

**Spec:** `03-caregiver-documents-credential-tracking` | **Phase:** 2-API | **Task:** 02

## Prerequisites
- `caregiver_documents` table exists (task-01).
- `verifyJWT` and `requireRole` middleware exist at `apps/api/src/middleware/`.
- AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) installed in `apps/api`.
- Environment variables set: `AWS_REGION`, `AWS_S3_PRIVATE_DOCUMENTS_BUCKET`.
- `DocumentUploadSchema` exported from `@crystal/validation`.

## Context
Before a caregiver's browser can upload a file to S3, the API must generate a short-lived presigned PUT URL. This keeps AWS credentials server-side only. The route also creates a `caregiver_documents` row in `pending_upload` status so the document has a stable UUID before the file transfer begins. The frontend will use the returned `uploadUrl` to PUT directly to S3, then call task-03 to confirm.

## Stack & Files
- **Layer:** Express API
- **Create:** `apps/api/src/modules/documents/documents.router.ts` — mounts all document routes; add `POST /upload-url` here
- **Create:** `apps/api/src/modules/documents/documents.controller.ts` — `requestUploadUrl` handler
- **Create:** `apps/api/src/modules/documents/documents.service.ts` — `generatePresignedPutUrl` business logic
- **Create:** `apps/api/src/modules/documents/documents.repository.ts` — `createDocumentRecord` DB insert
- **Create:** `apps/api/src/modules/documents/documents.schema.ts` — re-exports `DocumentUploadSchema` from `@crystal/validation`
- **Modify:** `apps/api/src/app.ts` — mount `documentsRouter` at `/api/v1/documents`

## Deliverable
An Express route `POST /api/v1/documents/upload-url` that authenticates the caregiver via `verifyJWT`, validates the request body with `DocumentUploadSchema`, generates a 15-minute S3 presigned PUT URL with `ServerSideEncryption: 'aws:kms'`, inserts a `caregiver_documents` row with `verification_status = 'pending_upload'`, and returns `{ success: true, data: { uploadUrl, fileKey, documentId } }`.

## Inputs
```typescript
// Request body — validated against DocumentUploadSchema from @crystal/validation
{
  caregiver_id: string;       // UUID — must match JWT subject or requester must be coordinator+
  category: DocumentCategoryType;
  file_name: string;
  file_size_bytes: number;    // max 25_000_000 (25 MB)
  mime_type: 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/heic';
  issue_date?: string;        // YYYY-MM-DD
  expiration_date?: string;   // YYYY-MM-DD
  has_no_expiration?: boolean;
}
```

## Outputs
**200 Success:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/...",
    "fileKey": "org_id/caregivers/caregiver_id/cpr_first_aid-1234567890-cert.pdf",
    "documentId": "uuid-v4"
  }
}
```
**400 Validation Error:**
```json
{ "success": false, "error": "Validation failed", "details": [ ... ] }
```
**401 Unauthorized:**
```json
{ "success": false, "error": "Unauthorized" }
```
**403 Forbidden:**
```json
{ "success": false, "error": "Cannot upload documents for another caregiver" }
```

## Acceptance Criteria
- [ ] A caregiver JWT can only pass `caregiver_id` that resolves to their own profile; passing another caregiver's ID returns `403`.
- [ ] The presigned URL expires in exactly 900 seconds (15 minutes).
- [ ] The S3 `PutObjectCommand` specifies `ServerSideEncryption: 'aws:kms'` and `ContentType` matching the submitted `mime_type`.
- [ ] A `caregiver_documents` row is created with `verification_status = 'pending_upload'` before the URL is returned.
- [ ] File size > 25 MB in the request body returns a `400` Zod validation error before any S3 call is made.

## Do NOT
- Do NOT upload the file itself — only generate and return the presigned URL.
- Do NOT mark the document as `under_review` in this route (that happens in task-03 confirm).
- Do NOT create any frontend components or DB migrations.
- Do NOT call the OCR agent from this route.
