# Feature Specification: Notifications & Automation Engine

## 1. Executive Summary & Scope

### 1.1 Goal
Provide a centralized, HIPAA-compliant event-driven communication and background automation engine that coordinates transactional emails (via Amazon SES) and SMS alerts (via Twilio) for caregiver credential renewals, application status changes, in-service assignments, and prior authorization warnings.

### 1.2 Problem Statement
Decentralized notifications lead to duplicate messages, unencrypted PHI transmissions, failed delivery tracking, and manual staff reminder burdens.

### 1.3 Scope Boundaries
- **In-Scope:**
  - Multi-channel delivery: Email (SES), SMS (Twilio), In-App Notifications.
  - Strict PHI-stripping filter on all SMS messages (e.g. *"You have a new update in your secure portal"*, never disclosing medical conditions).
  - Outbox queue pattern with automatic exponential backoff retry.
  - Notification preference center (Email on/off, SMS on/off).
- **Out-of-Scope:**
  - Push notifications for native mobile apps (PWA / Web notifications supported).

---

## 2. PostgreSQL Database Schema (DDL) & RLS Policies

```sql
-- Notification Status Enum
CREATE TYPE notification_status_type AS ENUM (
    'queued',
    'sending',
    'delivered',
    'failed',
    'cancelled'
);

-- Notification Outbox Queue Table
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'IN_APP')),
    template_id VARCHAR(100) NOT NULL, -- e.g. 'cpr_expiry_30day', 'app_approved', 'quiz_passed'
    recipient_address VARCHAR(255) NOT NULL, -- Email address or E.164 phone number
    subject VARCHAR(255),
    rendered_body TEXT NOT NULL,
    template_variables JSONB DEFAULT '{}'::jsonb,
    status notification_status_type NOT NULL DEFAULT 'queued',
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 3,
    error_message TEXT,
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- In-App Notification Inbox Table
CREATE TABLE IF NOT EXISTS public.in_app_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notif_queue_status_sched ON public.notification_queue(status, scheduled_for) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_in_app_user_unread ON public.in_app_notifications(user_id, is_read);

-- Enable RLS
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users read own in_app notifications"
ON public.in_app_notifications FOR ALL
TO authenticated
USING (user_id = auth.uid());
```

---

## 3. TypeScript & Zod Validation Schemas

```typescript
import { z } from 'zod';

export const QueueNotificationSchema = z.object({
  recipient_user_id: z.string().uuid(),
  org_id: z.string().uuid(),
  channel: z.enum(['EMAIL', 'SMS', 'IN_APP']),
  template_id: z.string().min(2),
  recipient_address: z.string().min(5),
  subject: z.string().optional(),
  template_variables: z.record(z.unknown()),
  scheduled_for: z.string().datetime().optional(),
});
```

---

## 4. Server Actions & Worker Dispatcher

### 4.1 Server Action: `queueNotification`
```typescript
'use server';

import { QueueNotificationSchema } from '@/lib/schemas/notifications';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function queueNotification(input: z.infer<typeof QueueNotificationSchema>) {
  const parsed = QueueNotificationSchema.parse(input);
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('notification_queue')
    .insert({
      ...parsed,
      rendered_body: `Template: ${parsed.template_id}`, // Rendered via Mustache/React-Email
      status: 'queued',
    })
    .select()
    .single();

  if (error) throw error;
  return { success: true, id: data.id };
}
```

---

## 5. UI/UX & Component Architecture

### 5.1 Component Tree
```
src/components/notifications/
├── NotificationBell.tsx               # Header icon with real-time unread counter
├── NotificationDropdown.tsx           # Quick popover with recent alerts
└── NotificationCenterModal.tsx        # Paginated history view with "Mark all read"
```

---

## 6. Background Automation & Agent Triggers

- **Trigger:** Worker cron running every 1 minute (`* * * * *`).
- **Agent Integration:** `Agent-NotificationDispatcher`
- **Workflow:**
  1. Polls batch of up to 50 `queued` messages where `scheduled_for <= NOW()`.
  2. Dispatches via SES (for Email) or Twilio API (for SMS).
  3. Updates status to `delivered` or records error and increments `retry_count`.

---

## 7. Edge Cases & Failure Recovery Matrix

| Failure Scenario | Root Cause | System Response & Mitigation |
| :--- | :--- | :--- |
| **Twilio SMS Carrier Block** | Carrier filters marketing keywords | Twilio toll-free / 10DLC verified route used with strictly clinical/transactional templates. |
| **SES Bounced Email** | Bad email address entered | SES bounce webhook updates status to `failed` and flags caregiver email as invalid in profile. |

---

## 8. Acceptance Test Suite (Gherkin Syntax)

```gherkin
Feature: Notifications & Automation Engine

  Scenario: Automated dispatch of renewal reminder
    Given a caregiver with CPR expiring in 30 days
    When the notification dispatcher worker triggers
    Then an email is queued with template "cpr_expiry_30day"
    And the message is dispatched to Amazon SES
    And the queue record transitions to "delivered"
```
