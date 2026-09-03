# Task 03: `GET /api/v1/notifications/inbox` — Paginated Notification Inbox Route

**Spec:** `08-notifications-automation-engine` | **Phase:** 2-API | **Task:** 03

## Prerequisites
- Task 01: `public.in_app_notifications` table must exist with RLS enabled.
- Task 02: `notifications.router.ts`, `notifications.controller.ts`, `notifications.service.ts`, `notifications.repository.ts` must exist.
- `apps/api/src/middleware/verifyJWT.ts` must exist.

## Context
Every authenticated user needs to fetch their own in-app notification inbox. The route reads from `in_app_notifications` filtered by the requesting user's ID (from the verified JWT), supports pagination via `page` and `limit` query params, and optionally filters to unread-only. The `NotificationBell` component (Task 06) calls this with `unread=true` to get the badge count; the `NotificationCenterModal` (Task 08) calls it for full paginated history.

## Stack & Files
- **Layer:** Express API
- **Modify:** `apps/api/src/modules/notifications/notifications.controller.ts` — add `getInbox` handler
- **Modify:** `apps/api/src/modules/notifications/notifications.service.ts` — add `getUserInbox(userId, opts)` method
- **Modify:** `apps/api/src/modules/notifications/notifications.repository.ts` — add `findInboxByUser` SQL query
- **Modify:** `apps/api/src/modules/notifications/notifications.schema.ts` — add `InboxQuerySchema` Zod schema
- **Modify:** `apps/api/src/modules/notifications/notifications.router.ts` — wire `GET /inbox` to handler

## Deliverable
An Express route `GET /api/v1/notifications/inbox` that returns the authenticated user's in-app notifications, sorted newest-first, with pagination metadata and an optional `unread=true` filter.

## Inputs

Query parameters (`InboxQuerySchema`):
```typescript
{
  page?: number;      // default 1, min 1
  limit?: number;     // default 20, max 100
  unread?: boolean;   // if true, only return rows where is_read = false
}
```

## Outputs

**200 OK:**
```typescript
{
  success: true,
  data: Array<{
    id: string;
    title: string;
    message: string;
    action_url: string | null;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
  }>,
  pagination: {
    page: number;
    limit: number;
    total: number;       // total matching rows for this user
    unread_count: number; // total unread rows for this user (always returned)
  }
}
```

**401 Unauthorized:**
```typescript
{ success: false, error: 'Unauthorized' }
```

## Acceptance Criteria
- [ ] `GET /api/v1/notifications/inbox` returns only notifications where `user_id` matches `req.user.id` from the JWT.
- [ ] Default response is sorted by `created_at DESC` with `limit=20`.
- [ ] `?unread=true` returns only rows where `is_read = false`.
- [ ] `pagination.unread_count` is always included regardless of the `unread` filter.
- [ ] An unauthenticated request returns `401`.

## Do NOT
- Do not return notifications belonging to other users — always filter by `req.user.id`.
- Do not allow querying another user's inbox by passing a `userId` query param — the user ID comes from the JWT only.
- Do not add the mark-read logic here — that is Task 04.
- Do not return `notification_queue` rows — only `in_app_notifications` rows.
