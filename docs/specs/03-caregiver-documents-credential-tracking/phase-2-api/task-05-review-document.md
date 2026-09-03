# Task 05: Review Document (Approve or Reject)

**Spec:** `03-caregiver-documents-credential-tracking` | **Phase:** 2-API | **Task:** 05

## Prerequisites
- task-01 DB schema applied.
- task-02 documents module scaffolded.
- `verifyJWT` and `requireRole` middleware exist.
- `DocumentReviewSchema` exported from `@crystal/validation`.

## Context
Coordinators and admins review documents uploaded by caregivers. This route updates the `verification_status` to `approved` or `rejected`, stores the reviewer's identity and timestamp, optionally corrects the expiration date, and writes an immutable `APPROVE` or `REJECT` audit log entry. Caregivers cannot access this route.

## Stack & Files
- **Layer:** Express API
- **Modify:** `apps/api/src/modules/documents/documents.router.ts` — add `PUT /:id/review` route, apply `requireRole(['coordinator', 'admin', 'super_admin'])` middleware
- **Modify:** `apps/api/src/modules/documents/documents.controller.ts` — add `reviewDocument` handler
- **Modify:** `apps/api/src/modules/documents/documents.service.ts` — add `processDocumentReview` function
- **Modify:** `apps/api/src/modules/documents/documents.repository.ts` — add `updateDocumentReview` function

## Deliverable
An Express route `PUT /api/v1/documents/:id/review` restricted to `coordinator`, `admin`, and `super_admin` roles that validates the request body with `DocumentReviewSchema`, updates `verification_status`, `verified_by`, `verified_at`, and optionally `rejection_reason` and `expiration_date`, writes an `APPROVE` or `REJECT` audit log entry, and returns `{ success: true, data: { documentId, status } }`.

## Inputs
```typescript
// Route param
{ id: string }  // UUID of the caregiver_documents row

// Request body — validated against DocumentReviewSchema from @crystal/validation
{
  decision: 'approved' | 'rejected';
  rejection_reason?: string;          // required when decision = 'rejected', min 5 chars
  corrected_expiration_date?: string; // YYYY-MM-DD, optional correction by reviewer
}
```

## Outputs
**200 Success:**
```json
{
  "success": true,
  "data": {
    "documentId": "uuid-v4",
    "status": "approved"
  }
}
```
**400 Validation Error (rejected without reason):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [{ "field": "rejection_reason", "message": "Rejection reason is required when rejecting" }]
}
```
**403 Forbidden:**
```json
{ "success": false, "error": "Insufficient role" }
```
**404 Not Found:**
```json
{ "success": false, "error": "Document not found" }
```

## Acceptance Criteria
- [ ] A caregiver JWT receives `403` — route is gated by `requireRole(['coordinator', 'admin', 'super_admin'])`.
- [ ] Rejecting without a `rejection_reason` returns `400` validation error.
- [ ] On approval: `verification_status = 'approved'`, `verified_by = reviewer user_id`, `verified_at = NOW()`, `rejection_reason = null`.
- [ ] On rejection: `verification_status = 'rejected'`, `rejection_reason` stored, `verified_by` and `verified_at` set.
- [ ] An `APPROVE` or `REJECT` audit log entry is inserted into `document_audit_logs` atomically with the document update (use a DB transaction).
- [ ] If `corrected_expiration_date` is provided, it overwrites the stored `expiration_date`.

## Do NOT
- Do NOT allow reviewing a document in `expired` or `archived` state.
- Do NOT allow coordinators to review documents belonging to a different org (enforce `org_id` match).
- Do NOT create any frontend components or DB migrations.
- Do NOT send caregiver notifications from this route (that is the responsibility of `Agent-Compliance`).
