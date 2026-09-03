# Task 08: Notification Center Full History Modal
**Spec:** `08-notifications-automation-engine` | **Phase:** 3-Frontend | **Task:** 08

## Prerequisites
- [x] Task 03: `GET /api/v1/notifications/inbox` API route exists
- [x] Task 04: `PUT /api/v1/notifications/:id/read` API route exists

## Context
Caregivers and coordinators access the full notification center to review historical alerts, filter between read/unread items, and search past notifications.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/components/notifications/NotificationCenterModal.tsx`

## Deliverable
A dialog modal component (`NotificationCenterModal.tsx`) rendering a paginated list of all past notifications with filter tabs (`All`, `Unread`, `Read`) and date formatting.

## Inputs
- Props: `{ open: boolean, onOpenChange: (open: boolean) => void }`

## Outputs
- Rendered paginated notification history table/list

## Acceptance Criteria
- [ ] Displays paginated list with page navigation controls
- [ ] Filter tabs toggle between `All`, `Unread`, and `Read` notifications
- [ ] Individual notification cards show title, full message, date, and read status badge
- [ ] Includes "Mark all as read" header action button

## Do NOT
- Do not render unformatted raw UTC strings — format timestamps using relative time (e.g. "2 hours ago")
