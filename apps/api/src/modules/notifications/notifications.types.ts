import type {
  NotificationChannel,
  NotificationStatus,
  NotificationQueueItem,
} from '@crystal/types';

export interface EnqueueNotificationDTO {
  org_id: string;
  recipient_user_id?: string | null;
  channel: NotificationChannel;
  destination: string;
  subject?: string | null;
  payload: Record<string, unknown>;
}

export interface InAppNotificationItem {
  id: string;
  org_id: string;
  user_id: string;
  title: string;
  message: string;
  category: string;
  is_read: boolean;
  read_at?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export { NotificationQueueItem, NotificationChannel, NotificationStatus };
