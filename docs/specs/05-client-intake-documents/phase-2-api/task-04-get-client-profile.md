# Task 04: Create `GET /api/v1/clients/:id` client profile route

**Spec:** `05-client-intake-documents` | **Phase:** 2-API | **Task:** 04

## Prerequisites
- Task 01 complete: `clients` and `client_documents` tables exist.
- Task 02 complete: clients module files (`router`, `controller`, `service`, `repository`) exist.

## Context
The client 360 profile page (task 09) needs a single-client endpoint that returns the full record including all JSONB blobs — `emergency_contacts`, `care_needs`, `primary_physician`, and `payer_details` — plus a list of the client's documents from `client_documents`. The service must verify that the requested client belongs to the requesting user's `org_id` before returning data.

## Stack & Files
- **Layer:** Express API
- **Modify:** `apps/api/src/modules/clients/clients.router.ts` — add `GET /:id` route with `verifyJWT` + `requireRole(['admin','coordinator'])`
- **Modify:** `apps/api/src/modules/clients/clients.controller.ts` — add `getClientProfile` handler
- **Modify:** `apps/api/src/modules/clients/clients.service.ts` — add `getClientProfile(clientId, orgId)` function with org ownership check
- **Modify:** `apps/api/src/modules/clients/clients.repository.ts` — add `findClientById(clientId)` and `findDocumentsByClientId(clientId)` functions

## Deliverable
An Express route `GET /api/v1/clients/:id` that retrieves the full `clients` row plus all associated `client_documents` rows, verifies `org_id` ownership, and returns the complete profile shape or a 404 if not found / not owned.

## Inputs
- **Route param:** `id` — UUID of the client
- **JWT payload:** `{ app_metadata: { org_id: string, role: string } }`

## Outputs
**HTTP 200 — Success:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "org_id": "uuid",
    "state_code": "GA",
    "status": "active",
    "first_name": "Robert",
    "last_name": "Smith",
    "dob": "1960-03-15",
    "gender": "Male",
    "ssn_last4": "4321",
    "medicaid_id": "GA12345",
    "primary_phone": "555-123-4567",
    "service_address": { "street": "123 Peach St", "city": "Atlanta", "state": "GA", "zip": "30301" },
    "emergency_contacts": [{ "name": "Mary Smith", "relationship": "Spouse", "phone": "555-999-0000", "is_primary": true, "has_poa": false }],
    "primary_physician": { "name": "Dr. Jones", "practice": "Peach Clinic", "phone": "555-888-1111", "npi": "1234567890" },
    "care_needs": { "adls": ["bathing", "dressing"], "iadls": [], "allergies": ["penicillin"], "diagnoses": ["CHF"] },
    "primary_payer": "medicaid_waiver",
    "payer_details": { "policy_number": "POL-001", "case_manager_name": "Kim Lee" },
    "assigned_rn_id": null,
    "documents": [
      {
        "id": "uuid",
        "doc_type": "physician_orders_485",
        "file_name": "order_2026.pdf",
        "file_size_bytes": 204800,
        "mime_type": "application/pdf",
        "effective_date": "2026-01-01",
        "expiration_date": "2027-01-01",
        "created_at": "2026-01-05T10:00:00Z"
      }
    ],
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-15T08:30:00Z"
  }
}
```

**HTTP 404 — Not found or wrong org:**
```json
{ "success": false, "error": "Client not found" }
```

**HTTP 401 / 403:** Standard error shape.

## Acceptance Criteria
- [ ] `GET /api/v1/clients/:id` returns HTTP 200 with full profile including all JSONB fields and nested `documents` array.
- [ ] Requesting a client belonging to a different org returns HTTP 404 (not 403 — do not leak existence).
- [ ] `documents` array is empty `[]` when the client has no uploaded documents, not `null`.
- [ ] Requesting a non-existent UUID returns HTTP 404.
- [ ] Response includes `file_storage_path` — wait, do NOT include `file_storage_path` in the response (security — presigned URLs are fetched separately).

## Do NOT
- Do not include `file_storage_path` in the documents array response — it is an internal S3 path; presigned download URLs are out of scope for this task.
- Do not allow `caregiver` role to access this endpoint.
- Do not implement profile editing (PUT) here — that is handled in task 05 (status) and future tasks.
- Do not return cross-org data even if the JWT role is `coordinator`.
