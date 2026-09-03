# Spec 08: Notifications & Automation Engine

## Goal
Provide a centralized, HIPAA-compliant, event-driven communication engine that coordinates transactional emails (Amazon SES) and SMS alerts (Twilio) alongside in-app notifications for caregiver credential renewals, application status changes, in-service assignments, and prior authorization warnings.

## Problem Statement
Decentralized notifications lead to duplicate messages, unencrypted PHI transmissions, failed delivery tracking, and heavy manual staff reminder burdens.

## Scope

### In-Scope
- Multi-channel delivery: **Email** (Amazon SES), **SMS** (Twilio), **In-App Notifications**.
- Strict PHI-stripping filter on all SMS messages — messages must never disclose medical conditions.
- Outbox queue pattern (`notification_queue` table) with automatic exponential backoff retry (max 3 attempts).
- Notification preference center — Email on/off, SMS on/off per user.
- In-app notification inbox with unread badge count.
- `node-cron` dispatcher worker polling every minute.

### Out-of-Scope
- Native mobile push notifications (PWA / Web Notifications API is a later spec).
- Marketing / bulk campaign emails.
- Real-time WebSocket push for in-app notifications (30-second polling is acceptable).

## Key Domain Concepts

| Term | Meaning |
|---|---|
| `notification_queue` | Outbox table — one row per pending delivery attempt |
| `in_app_notifications` | Inbox table — one row per in-app alert shown to a user |
| `template_id` | Human-readable key e.g. `cpr_expiry_30day`, `app_approved`, `quiz_passed` |
| `channel` | `EMAIL` \| `SMS` \| `IN_APP` |
| `status` | `queued` → `sending` → `delivered` \| `failed` \| `cancelled` |
| `scheduled_for` | Rows are not dispatched until `NOW() >= scheduled_for` |

## Notification Templates (Reference)

| `template_id` | Channel(s) | Trigger |
|---|---|---|
| `cpr_expiry_30day` | EMAIL, SMS | Caregiver CPR cert expiring in 30 days |
| `app_approved` | EMAIL, IN_APP | Caregiver application approved |
| `app_submitted` | EMAIL, IN_APP | Caregiver application received |
| `quiz_passed` | IN_APP | In-service quiz passed |
| `auth_expiring_soon` | EMAIL, IN_APP | Client authorization expiring soon |

## PHI Stripping Rule
All SMS `rendered_body` values **must not** contain:
- Diagnosis codes or medical condition names
- Specific medication names
- Any client name or date of birth
- Any caregiver health information

Acceptable SMS pattern: `"[Crystal] You have a portal update. Log in at https://portal.crystalcare.com"`

## Retry / Backoff Logic
- `retry_count` starts at 0.
- On failure, increment `retry_count` and reschedule: `scheduled_for = NOW() + (2 ^ retry_count) minutes`.
- When `retry_count >= max_retries` (default 3), set `status = 'failed'` permanently.

## Edge Cases

| Failure Scenario | Root Cause | System Response & Mitigation |
|---|---|---|
| **Twilio SMS Carrier Block** | Carrier filters marketing keywords | Use toll-free / 10DLC verified route with strictly clinical/transactional templates. PHI-strip enforced before send. |
| **SES Bounced Email** | Bad email address entered | SES bounce SNS webhook updates `notification_queue.status` to `failed` and flags caregiver email as invalid in `caregiver_profiles`. |
| **Dispatcher crashes mid-batch** | Unhandled exception in cron worker | Rows stuck in `sending` status are reset to `queued` on next worker boot if `sent_at` is null after 5 minutes. |
| **User has no email/phone set** | Incomplete caregiver profile | `queueNotification` returns `400 Bad Request` with message `"recipient_address is required"`. |

## Acceptance Tests (Gherkin)

```gherkin
Feature: Notifications & Automation Engine

  Scenario: Automated dispatch of credential renewal reminder
    Given a caregiver with CPR certification expiring in 30 days
    When the notification dispatcher worker triggers
    Then a row exists in notification_queue with template_id "cpr_expiry_30day" and status "queued"
    And the dispatcher updates status to "sending" during processing
    And on SES success the row status transitions to "delivered"

  Scenario: Failed delivery triggers exponential backoff retry
    Given a notification_queue row with status "queued" and retry_count 1
    When the dispatcher attempts delivery and SES returns an error
    Then retry_count increments to 2
    And scheduled_for is set to NOW() + 2 minutes
    And status remains "queued"

  Scenario: Max retries exceeded marks notification as failed
    Given a notification_queue row with retry_count equal to max_retries (3)
    When the dispatcher attempts delivery and it fails again
    Then status is set to "failed"
    And no further retry is scheduled

  Scenario: In-app notification appears in user inbox
    Given a queued IN_APP notification for user Alice
    When the dispatcher processes the row
    Then a row is inserted into in_app_notifications for Alice
    And GET /api/v1/notifications/inbox returns that notification
    And the NotificationBell badge count increments by 1

  Scenario: User marks notification read
    Given Alice has an unread in_app_notification
    When she calls PUT /api/v1/notifications/:id/read
    Then is_read is set to true and read_at is set to NOW()
    And the bell badge count decrements by 1

  Scenario: SMS message is PHI-stripped
    Given a notification with channel SMS and template_id "app_approved"
    When the dispatcher renders the body
    Then the rendered_body contains no medical condition names, diagnosis codes, or client PII
```

## Task Map

| Task | Phase | Deliverable |
|---|---|---|
| task-01 | Database | `notification_queue` + `in_app_notifications` DDL + RLS + indexes |
| task-02 | API | `POST /api/v1/notifications/queue` internal route |
| task-03 | API | `GET /api/v1/notifications/inbox` paginated inbox route |
| task-04 | API | `PUT /api/v1/notifications/:id/read` mark-read route |
| task-05 | API | `node-cron` dispatcher worker |
| task-06 | Frontend | `NotificationBell.tsx` header icon with badge |
| task-07 | Frontend | `NotificationDropdown.tsx` quick popover |
| task-08 | Frontend | `NotificationCenterModal.tsx` full paginated history |
