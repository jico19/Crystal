import { db } from '../../db/index.js';
import type {
  EnqueueNotificationDTO,
  NotificationQueueItem,
  InAppNotificationItem,
} from './notifications.types.js';

export class NotificationsRepository {
  async enqueue(dto: EnqueueNotificationDTO): Promise<NotificationQueueItem> {
    const query = `
      INSERT INTO public.notification_queue (
        org_id, recipient_user_id, channel, destination, subject, payload, status, next_retry_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'queued', NOW())
      RETURNING *;
    `;
    const values = [
      dto.org_id,
      dto.recipient_user_id || null,
      dto.channel,
      dto.destination,
      dto.subject || null,
      JSON.stringify(dto.payload || {}),
    ];

    const res = await db.query(query, values);
    return res.rows[0];
  }

  async fetchPendingOutbox(limit = 50): Promise<NotificationQueueItem[]> {
    const query = `
      SELECT * FROM public.notification_queue
      WHERE status = 'queued' AND next_retry_at <= NOW()
      ORDER BY next_retry_at ASC
      LIMIT $1;
    `;
    const res = await db.query(query, [limit]);
    return res.rows;
  }

  async markSent(id: string): Promise<void> {
    const query = `
      UPDATE public.notification_queue
      SET status = 'sent', sent_at = NOW()
      WHERE id = $1;
    `;
    await db.query(query, [id]);
  }

  async recordRetry(id: string, attempts: number, nextDelaySec: number, error: string): Promise<void> {
    const query = `
      UPDATE public.notification_queue
      SET attempts = $1,
          next_retry_at = NOW() + ($2 || ' seconds')::interval,
          error_log = $3
      WHERE id = $4;
    `;
    await db.query(query, [attempts, nextDelaySec, error, id]);
  }

  async markPermanentlyFailed(id: string, attempts: number, error: string): Promise<void> {
    const query = `
      UPDATE public.notification_queue
      SET status = 'failed',
          attempts = $1,
          error_log = $2
      WHERE id = $3;
    `;
    await db.query(query, [attempts, error, id]);
  }

  async createInApp(
    orgId: string,
    userId: string,
    title: string,
    message: string,
    category = 'system',
    metadata: Record<string, unknown> = {}
  ): Promise<InAppNotificationItem> {
    const query = `
      INSERT INTO public.in_app_notifications (
        org_id, user_id, title, message, category, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const res = await db.query(query, [
      orgId,
      userId,
      title,
      message,
      category,
      JSON.stringify(metadata),
    ]);
    return res.rows[0];
  }

  async findInAppByUser(
    userId: string,
    orgId: string,
    unreadOnly = false
  ): Promise<InAppNotificationItem[]> {
    let query = `
      SELECT * FROM public.in_app_notifications
      WHERE user_id = $1 AND org_id = $2
    `;
    if (unreadOnly) {
      query += ` AND is_read = false`;
    }
    query += ` ORDER BY created_at DESC LIMIT 50;`;

    const res = await db.query(query, [userId, orgId]);
    return res.rows;
  }

  async markInAppRead(id: string, userId: string): Promise<InAppNotificationItem | null> {
    const query = `
      UPDATE public.in_app_notifications
      SET is_read = true, read_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *;
    `;
    const res = await db.query(query, [id, userId]);
    return res.rows[0] || null;
  }
}

export const notificationsRepository = new NotificationsRepository();
