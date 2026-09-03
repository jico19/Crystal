# Task 05: Create `PUT /api/v1/clients/:id/status` status transition route

**Spec:** `05-client-intake-documents` | **Phase:** 2-API | **Task:** 05

## Prerequisites
- Task 01 complete: `clients` table with `client_status_type` enum exists.
- Task 02 complete: clients module files exist.
- Task 04 complete: `findClientById` repository function exists (reused for current-status lookup).

## Context
Client lifecycle status must follow a strict directed graph to prevent illogical transitions (e.g., jumping from `inquiry` to `discharged` without intake). This route accepts the desired new status, looks up the client's current status, validates the transition is allowed, and updates the record. Only `admin` role may perform status transitions; coordinators may not.

## Stack & Files
- **Layer:** Express API
- **Modify:** `apps/api/src/modules/clients/clients.router.ts` — add `PUT /:id/status` route with `verifyJWT` + `requireRole(['admin'])`
- **Modify:** `apps/api/src/modules/clients/clients.controller.ts` — add `updateClientStatus` handler
- **Modify:** `apps/api/src/modules/clients/clients.service.ts` — add `updateClientStatus(clientId, orgId, newStatus)` with transition validation
- **Modify:** `apps/api/src/modules/clients/clients.repository.ts` — add `updateClientStatus(clientId, status)` function

## Deliverable
An Express route `PUT /api/v1/clients/:id/status` that validates the requested status transition against the allowed transition map, updates `clients.status` and `clients.updated_at`, and returns the updated status — or HTTP 422 with allowed transitions if the transition is invalid.

## Inputs
Request body:
```typescript
{
  status: 'inquiry' | 'intake_pending' | 'assessment_scheduled' | 'active' | 'on_hold' | 'discharged';
}
```

Route param: `id` — UUID of the client.
JWT payload: `{ app_metadata: { org_id: string, role: 'admin' } }`

## Outputs
**HTTP 200 — Success:**
```json
{ "success": true, "data": { "clientId": "uuid", "previousStatus": "intake_pending", "newStatus": "assessment_scheduled" } }
```

**HTTP 422 — Invalid transition:**
```json
{
  "success": false,
  "error": "Invalid status transition from 'active' to 'intake_pending'",
  "data": { "allowedTransitions": ["on_hold", "discharged"] }
}
```

**HTTP 404 — Client not found / wrong org:**
```json
{ "success": false, "error": "Client not found" }
```

**HTTP 401 / 403:** Standard error shape.

## Transition Map (implement exactly)
```
inquiry             → [intake_pending]
intake_pending      → [assessment_scheduled, discharged]
assessment_scheduled→ [active, on_hold, discharged]
active              → [on_hold, discharged]
on_hold             → [active, discharged]
discharged          → [] (terminal — no transitions allowed)
```

## Acceptance Criteria
- [ ] `PUT /api/v1/clients/:id/status` with a valid transition updates the DB row and returns HTTP 200 with `previousStatus` and `newStatus`.
- [ ] Attempting a transition not in the allowed map returns HTTP 422 with the `allowedTransitions` array.
- [ ] Attempting any transition from `discharged` returns HTTP 422 (terminal state).
- [ ] A `coordinator` role receives HTTP 403.
- [ ] Updating a client in a different org returns HTTP 404.

## Do NOT
- Do not implement bulk status updates in this task.
- Do not allow `coordinator` or `caregiver` roles to call this endpoint.
- Do not modify any other `clients` fields in this route — it is status-only.
- Do not skip the org ownership check — reuse `findClientById` and verify `org_id`.
