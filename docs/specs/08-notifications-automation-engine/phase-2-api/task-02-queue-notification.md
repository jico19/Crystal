# Task 02: `POST /api/v1/notifications/queue` — Internal Queue Notification Route

**Spec:** `08-notifications-automation-engine` | **Phase:** 2-API | **Task:** 02

## Prerequisites
- Task 01: `public.notification_queue` table must exist.
- `apps/api/src/middleware/verifyJWT.ts` must exist.
- `apps/api/src/db/index.ts` must export a `db` query helper.

## Context
Other API modules (e.g., caregivers, clients, authorizations) need a reliable way to enqueue notifications without calling SES or Twilio directly. This internal Express route accepts a structured payload, validates it with Zod, and inserts a `queued` row into `notification_queue`. It is **not** called from the frontend — only from other Express route handlers within `apps/api/`. The route requires a valid service-level JWT (i.e., `super_admin` or a machine-to-machine token) to prevent public abuse.

## Stack & Files
- **Layer:** Express API
- **Create:** `apps/api/src/modules/notifications/notifications.router.ts` — mounts all notification routes
- **Create:** `apps/api/src/modules/notifications/notifications.controller.ts` — request/response handling
- **Create:** `apps/api/src/modules/notifications/notifications.service.ts` — DB inserts and business logic
- **Create:** `apps/api/src/modules/notifications/notifications.repository.ts` — raw SQL insert for `notification_queue`
- **Create:** `apps/api/src/modules/notifications/notifications.schema.ts` — `QueueNotificationSchema` Zod schema
- **Modify:** `apps/api/src/index.ts` — mount `notificationsRouter` at `/api/v1/notifications`

## Deliverable
An Express route `POST /api/v1/notifications/queue` that validates the request body with `QueueNotificationSchema`, inserts a row into `notification_queue` with `status = 'queued'`, and returns `{ success: true, data: { id } }`.

## Inputs

Request body (`QueueNotificationSchema`):
```typescript
{
  recipient_user_id: string;       // UUID
  org_id: string;                  // UUID
  channel: 'EMAIL' | 'SMS' | 'IN_APP';
  template_id: string;             // min length 2, e.g. "cpr_expiry_30day"
  recipient_address: string;       // email or E.164 phone, min length 5
  subject?: string;                // required for EMAIL channel
  template_variables: Record<string, unknown>;
  scheduled_for?: string;          // ISO 8601 datetime; defaults to NOW()
}
```

The service layer must render `rendered_body` from `template_id` + `template_variables` before inserting. For now, a placeholder renderer is acceptable: `` `Template: ${template_id}` ``.

## Outputs

**201 Created — success:**
```typescript
{ success: true, data: { id: string } }  // id is the new notification_queue UUID
```

**400 Bad Request — Zod validation failure:**
```typescript
{ success: false, error: 'Validation error', details: ZodIssue[] }
```

**401 Unauthorized:**
```typescript
{ success: false, error: 'Unauthorized' }
```

**500 Internal Server Error — DB insert failure:**
```typescript
{ success: false, error: 'Failed to queue notification' }
```

## Acceptance Criteria
- [ ] `POST /api/v1/notifications/queue` with a valid body inserts exactly one row into `notification_queue` with `status = 'queued'` and `retry_count = 0`.
- [ ] Omitting `recipient_user_id` returns `400` with a Zod error describing the missing field.
- [ ] Sending `channel: 'PUSH'` (not in enum) returns `400`.
- [ ] An unauthenticated request returns `401`.
- [ ] `scheduled_for` defaults to `NOW()` when omitted from the request body.

## Do NOT
- Do not call SES or Twilio from this route — delivery is handled by the cron dispatcher in Task 05.
- Do not expose this route to frontend callers — document it as internal-only with a comment in the router file.
- Do not implement template rendering beyond a placeholder in this task.
- Do not add the inbox or mark-read routes here — those are Tasks 03 and 04.
