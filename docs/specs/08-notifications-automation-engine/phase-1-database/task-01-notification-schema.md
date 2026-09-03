# Task 01: Create `notification_queue` and `in_app_notifications` Tables

**Spec:** `08-notifications-automation-engine` | **Phase:** 1-Database | **Task:** 01

## Prerequisites
- `public.organizations` table must exist (Spec 01).
- `auth.users` table must exist (Supabase built-in).
- `uuid_generate_v4()` extension must be enabled (`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`).

## Context
The notification system uses an **outbox queue pattern**: instead of calling SES or Twilio synchronously during a user action, every notification request is written to `notification_queue` first. A separate `node-cron` worker (Task 05) polls and dispatches. The `in_app_notifications` table is the inbox for in-app alerts shown to users in the UI. Both tables need RLS so users can only see their own records; the API service role bypasses RLS for inserts.

## Stack & Files
- **Layer:** Database Migration
- **Create:** `db_schema/migrations/0015_create_notification_tables.sql` — DDL for both tables, enum type, indexes, and RLS policies

## Deliverable
A single SQL migration file that creates the `notification_status_type` enum, the `notification_queue` table, the `in_app_notifications` table, two performance indexes, enables RLS on both tables, and creates the user-read RLS policy for `in_app_notifications`.

## Inputs
No runtime inputs — this is a DDL migration.

## Outputs
After migration runs:

**`notification_queue` columns:**
```
id UUID PK
org_id UUID FK → organizations
recipient_user_id UUID FK → auth.users (NOT NULL)
channel VARCHAR(20) CHECK IN ('EMAIL','SMS','IN_APP')
template_id VARCHAR(100) NOT NULL
recipient_address VARCHAR(255) NOT NULL
subject VARCHAR(255)
rendered_body TEXT NOT NULL
template_variables JSONB DEFAULT '{}'
status notification_status_type DEFAULT 'queued'
retry_count INT DEFAULT 0
max_retries INT DEFAULT 3
error_message TEXT
scheduled_for TIMESTAMPTZ DEFAULT NOW()
sent_at TIMESTAMPTZ
created_at TIMESTAMPTZ DEFAULT NOW()
```

**`in_app_notifications` columns:**
```
id UUID PK
user_id UUID FK → auth.users (NOT NULL)
org_id UUID FK → organizations
title VARCHAR(255) NOT NULL
message TEXT NOT NULL
action_url TEXT
is_read BOOLEAN DEFAULT false
read_at TIMESTAMPTZ
created_at TIMESTAMPTZ DEFAULT NOW()
```

## Acceptance Criteria
- [ ] `\d public.notification_queue` shows all columns with the correct types and constraints.
- [ ] `\d public.in_app_notifications` shows all columns including `is_read BOOLEAN NOT NULL DEFAULT false`.
- [ ] `SELECT * FROM pg_indexes WHERE tablename = 'notification_queue'` includes `idx_notif_queue_status_sched` (partial index on `status = 'queued'`).
- [ ] `SELECT * FROM pg_indexes WHERE tablename = 'in_app_notifications'` includes `idx_in_app_user_unread`.
- [ ] RLS is enabled on both tables (`pg_class.relrowsecurity = true`).
- [ ] A non-owner authenticated user querying `in_app_notifications` only sees rows where `user_id = auth.uid()`.
- [ ] Migration runs idempotently using `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.

## Do NOT
- Do not create application-layer code (no TypeScript, no routes) in this task.
- Do not create the `notification_queue` RLS policy for users — only the service role writes to this table; user read access to the queue is never needed.
- Do not create the cron worker or any trigger functions — that is Task 05.
- Do not alter `auth.users` directly.
