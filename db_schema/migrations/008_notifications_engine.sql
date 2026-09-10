-- ============================================================================
-- Migration 008: Notifications & Automation Engine (Spec 08)
-- ============================================================================

-- Step 1: Create ENUM types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel_type') THEN
    CREATE TYPE notification_channel_type AS ENUM (
      'email',
      'sms',
      'in_app'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status_type') THEN
    CREATE TYPE notification_status_type AS ENUM (
      'queued',
      'sent',
      'failed'
    );
  END IF;
END $$;

-- Step 2: Create notification_queue table (Outbox Pattern)
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  recipient_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  channel notification_channel_type NOT NULL,
  destination TEXT NOT NULL,
  subject TEXT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status notification_status_type NOT NULL DEFAULT 'queued',
  attempts INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_log TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_notif_queue_status_retry ON public.notification_queue(status, next_retry_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_notif_queue_org ON public.notification_queue(org_id);

-- Step 3: Create in_app_notifications table (Inbox Pattern)
CREATE TABLE IF NOT EXISTS public.in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'system',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_in_app_notif_user_read ON public.in_app_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_in_app_notif_org ON public.in_app_notifications(org_id);

-- Step 4: Row-Level Security
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to notification_queue for service_role" ON public.notification_queue;
CREATE POLICY "Allow all access to notification_queue for service_role"
  ON public.notification_queue
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to in_app_notifications for service_role" ON public.in_app_notifications;
CREATE POLICY "Allow all access to in_app_notifications for service_role"
  ON public.in_app_notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);
