# Task 05: Notification Dispatcher Worker Cron Job
**Spec:** `08-notifications-automation-engine` | **Phase:** 2-API | **Task:** 05

## Prerequisites
- [x] Task 01: `notification_queue` table exists

## Context
The background notification worker polls pending messages from `notification_queue`, renders template parameters, and delivers emails via Amazon SES or SMS via Twilio API. It implements exponential backoff retries on failure.

## Stack & Files
- **Layer:** Express API / Background Worker
- **Create:** `apps/api/src/modules/notifications/notification-dispatcher.job.ts`
- **Create:** `apps/api/src/integrations/ses.adapter.ts`
- **Create:** `apps/api/src/integrations/twilio.adapter.ts`
- **Modify:** `apps/api/src/server.ts` — register cron schedule on boot

## Deliverable
A `node-cron` job running every minute (`* * * * *`) that fetches up to 50 queued notifications where `status = 'queued'` and `scheduled_for <= NOW()`, dispatches via SES (for `EMAIL`) or Twilio (for `SMS`), updates status to `delivered` (or increments `retry_count` and sets `status = 'failed'` if retries exceeded), and enforces PHI-stripping on SMS payloads.

## Inputs
- Database query: `SELECT * FROM notification_queue WHERE status = 'queued' AND scheduled_for <= NOW() ORDER BY scheduled_for ASC LIMIT 50`

## Outputs
- Amazon SES / Twilio API calls
- Updated `notification_queue` database status (`delivered` / `failed`)

## Acceptance Criteria
- [ ] Runs every minute via `node-cron`
- [ ] Strips any sensitive health keywords/PHI before calling Twilio SMS API
- [ ] Updates status to `'delivered'` and populates `sent_at = NOW()` on successful dispatch
- [ ] Implements exponential backoff: if dispatch fails, sets `retry_count += 1` and `scheduled_for = NOW() + (2 ^ retry_count) minutes`
- [ ] Marks status as `'failed'` if `retry_count >= max_retries` (3)

## Do NOT
- Do not transmit client diagnosis names, SSNs, or medical details over SMS
- Do not crash the API server process if SES or Twilio returns a network error
