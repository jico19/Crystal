# Task 04: Mark In-App Notification Read Route
**Spec:** `08-notifications-automation-engine` | **Phase:** 2-API | **Task:** 04

## Prerequisites
- [x] Task 01: `in_app_notifications` table exists
- [x] Task 03: `GET /api/v1/notifications/inbox` route exists

## Context
When a user clicks on an in-app notification or views their inbox, the application marks notification records as read.

## Stack & Files
- **Layer:** Express API
- **Modify:** `apps/api/src/modules/notifications/notification.router.ts` — mount `PUT /:id/read` and `PUT /mark-all-read`
- **Modify:** `apps/api/src/modules/notifications/notification.controller.ts`

## Deliverable
Express routes `PUT /api/v1/notifications/:id/read` and `PUT /api/v1/notifications/mark-all-read` that update `is_read = true` and `read_at = NOW()` for notifications belonging to `req.user.id`.

## Inputs
- Route parameter `:id` (Notification UUID) OR `mark-all-read` endpoint
- Auth Context: `req.user.id`

## Outputs
- `200 OK`: `{ success: true }`

## Acceptance Criteria
- [ ] Sets `is_read = true` and records `read_at` timestamp
- [ ] Users can only mark their own notifications as read (verifies `user_id = req.user.id`)
- [ ] `mark-all-read` updates all unread notifications for the user in a single transaction

## Do NOT
- Do not allow users to modify notifications of other users
