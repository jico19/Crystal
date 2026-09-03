# Task 05: Authorization Expiration Cron Job
**Spec:** `06-client-authorization-management` | **Phase:** 2-API | **Task:** 05

## Prerequisites
- [x] Task 01: `client_authorizations` table exists
- [x] Notification engine queued endpoint exists (`POST /api/v1/notifications/queue`)

## Context
Authorizations nearing expiration (60 days or 30 days remaining) must trigger alerts so agency coordinators can initiate Medicaid renewal packets. This background cron job runs daily at 01:00 AM inside the API process.

## Stack & Files
- **Layer:** Express API / Background Worker
- **Create:** `apps/api/src/modules/authorizations/authorization-cron.job.ts`
- **Modify:** `apps/api/src/server.ts` — register cron schedule on boot

## Deliverable
A `node-cron` job running daily at `0 1 * * *` that identifies authorizations where `end_date <= NOW() + 60 days` and status is `'active'`, updates status to `'expiring_soon'`, and queues escalation alerts to designated billing/care managers.

## Inputs
- Database query on `client_authorizations WHERE status = 'active' AND end_date <= NOW() + 60 days`

## Outputs
- Updated database rows (`status = 'expiring_soon'`)
- Inserted notification queue entries (`template_id = 'auth_expiring_60day'`)

## Acceptance Criteria
- [ ] Cron schedule set to `0 1 * * *` (1:00 AM daily)
- [ ] Updates authorizations within 60 days of expiration to `'expiring_soon'`
- [ ] Updates authorizations past `end_date` to `'expired'`
- [ ] Queues notification alerts for coordinators without sending duplicate emails if already notified today

## Do NOT
- Do not run external microservice workers — keep cron inside the unified Node.js API process using `node-cron`
