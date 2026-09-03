# Task 06: Notification Bell Header Component
**Spec:** `08-notifications-automation-engine` | **Phase:** 3-Frontend | **Task:** 06

## Prerequisites
- [x] Task 03: `GET /api/v1/notifications/inbox` route exists

## Context
Renders an interactive bell icon in the top header bar showing real-time unread notification counts. Clicking the bell toggles the notification dropdown.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/components/notifications/NotificationBell.tsx`
- **Create:** `apps/georgia/src/hooks/useNotifications.ts`

## Deliverable
A React header component (`NotificationBell.tsx`) polling `GET /api/v1/notifications/inbox?unreadOnly=true` every 30 seconds, rendering a red unread badge indicator, and triggering `NotificationDropdown` (Task 07).

## Inputs
- Polling interval: 30,000ms

## Outputs
- Rendered bell button icon with dynamic unread count badge (e.g. `3`)

## Acceptance Criteria
- [ ] Displays unread count badge when unread count > 0
- [ ] Automatically polls backend inbox every 30 seconds
- [ ] Hides badge when unread count is 0
- [ ] Clicking bell opens `NotificationDropdown`

## Do NOT
- Do not poll faster than 15 seconds to avoid flooding API
