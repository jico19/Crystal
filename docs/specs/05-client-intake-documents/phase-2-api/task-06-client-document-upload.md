# Task 06: Client Document Upload Presigned URL Route
**Spec:** `05-client-intake-documents` | **Phase:** 2-API | **Task:** 06

## Prerequisites
- [x] Task 01: `clients` and `client_documents` tables exist in PostgreSQL
- [x] Task 04: `GET /api/v1/clients/:id` route exists

## Context
Staff upload clinical assessments, physician orders (Form 485), face-to-face evaluations, and service agreements for a client. The frontend requests a short-lived (15-minute) S3 presigned PUT URL from this endpoint, uploads the binary file directly to S3, and records the document reference in PostgreSQL.

## Stack & Files
- **Layer:** Express API
- **Create:** `apps/api/src/modules/clients/client-document.controller.ts` — presigned URL handler
- **Modify:** `apps/api/src/modules/clients/client.router.ts` — mount `POST /:id/documents/upload-url`

## Deliverable
An Express route `POST /api/v1/clients/:id/documents/upload-url` that verifies staff authorization for the client's organization, generates a 15-minute S3 presigned PUT URL, inserts a pending record into `client_documents`, and returns `{ success: true, data: { uploadUrl, fileKey, documentId } }`.

## Inputs
- Route param: `id` (Client UUID)
- Request Body (validated via `ClientDocumentUploadSchema` from `@crystal/validation`):
```typescript
{
  doc_type: 'physician_orders_485' | 'rn_assessment' | 'service_agreement' | 'insurance_card' | 'poa_legal';
  file_name: string;
  file_size_bytes: number; // Max 25MB
  mime_type: 'application/pdf' | 'image/png' | 'image/jpeg';
  effective_date?: string; // YYYY-MM-DD
  expiration_date?: string; // YYYY-MM-DD
}
```

## Outputs
- `201 Created`: `{ success: true, data: { documentId: string, uploadUrl: string, fileKey: string } }`
- `400 Bad Request`: Validation failure or unsupported MIME type
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: User org_id does not match client's org_id
- `404 Not Found`: Client ID does not exist

## Acceptance Criteria
- [ ] Presigned upload URL expires in 900 seconds (15 minutes)
- [ ] Storage key follows format `${org_id}/clients/${client_id}/${doc_type}-${timestamp}-${file_name}`
- [ ] Database record inserted into `client_documents` with `file_storage_path`
- [ ] File size strictly capped at 25MB via Zod validation
- [ ] Access denied if staff `org_id` does not match the client's `org_id`

## Do NOT
- Do not stream binary file payloads through Express — direct S3 upload via presigned URL must be used
- Do not make public S3 buckets — all buckets must enforce private KMS AES-256 encryption
- Do not omit org_id validation on the client record check
