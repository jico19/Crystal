# Task 07: Notification Dropdown Popover
**Spec:** `08-notifications-automation-engine` | **Phase:** 3-Frontend | **Task:** 07

## Prerequisites
- [x] Task 03: `GET /api/v1/notifications/inbox` API route exists
- [x] Task 04: `PUT /api/v1/notifications/:id/read` API route exists

## Context
Provides a popover overlay when clicking the notification bell, listing the 5 most recent notifications with 1-click navigation links and a "Mark all as read" button.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/components/notifications/NotificationDropdown.tsx`

## Deliverable
A popover dropdown component (`NotificationDropdown.tsx`) rendering 5 recent notification items, an interactive "Mark all read" button, and a link to view the full notification history modal (Task 08).

## Inputs
- Props: `{ isOpen: boolean, onClose: () => void }`

## Outputs
- API calls: `PUT /api/v1/notifications/:id/read` or `PUT /api/v1/notifications/mark-all-read`

## Acceptance Criteria
- [ ] Displays 5 most recent notifications with title, timestamp, and read/unread indicator
- [ ] Clicking a notification item marks it as read and navigates to its `action_url` (if present)
- [ ] Clicking "Mark all read" updates all items and clears unread badge
- [ ] Displays empty state graphic if no notifications exist

## Do NOT
- Do not keep popover open when user clicks outside — close on outer click
