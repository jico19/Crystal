import { notificationsRepository } from './notifications.repository.js';
import { getEmailProvider } from '../../integrations/email/index.js';
import { getSmsProvider } from '../../integrations/sms/index.js';
import type { QueueNotificationInput } from '@crystal/validation';
import type {
  NotificationQueueItem,
  InAppNotificationItem,
} from './notifications.types.js';

export class NotificationsService {
  async queueNotification(input: QueueNotificationInput): Promise<NotificationQueueItem> {
    const queueItem = await notificationsRepository.enqueue({
      org_id: input.org_id,
      recipient_user_id: input.recipient_user_id,
      channel: input.channel,
      destination: input.destination,
      subject: input.subject,
      payload: input.payload,
    });

    // If in_app, create immediate inbox record for the user
    if (input.channel === 'in_app' && input.recipient_user_id) {
      await notificationsRepository.createInApp(
        input.org_id,
        input.recipient_user_id,
        input.subject || 'New Notification',
        (input.payload.message as string) || (input.payload.body as string) || 'You have a new alert',
        (input.payload.category as string) || 'system',
        input.payload
      );
    }

    return queueItem;
  }

  async processOutboxBatch(batchSize = 25): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    const pendingItems = await notificationsRepository.fetchPendingOutbox(batchSize);
    let succeeded = 0;
    let failed = 0;

    for (const item of pendingItems) {
      try {
        if (item.channel === 'email') {
          const emailProvider = getEmailProvider();
          const bodyContent =
            (item.payload.html as string) ||
            (item.payload.message as string) ||
            (item.payload.body as string) ||
            JSON.stringify(item.payload);

          await emailProvider.sendEmail({
            to: item.destination,
            subject: item.subject || 'Crystal Platform Notification',
            html: bodyContent,
            text: item.payload.text as string | undefined,
          });
        } else if (item.channel === 'sms') {
          const smsProvider = getSmsProvider();
          const messageText =
            (item.payload.body as string) ||
            (item.payload.message as string) ||
            item.subject ||
            'Notice from Crystal Care';

          await smsProvider.sendSms({
            to: item.destination,
            body: messageText,
          });
        } else if (item.channel === 'in_app') {
          if (item.recipient_user_id) {
            await notificationsRepository.createInApp(
              item.org_id,
              item.recipient_user_id,
              item.subject || 'Notification',
              (item.payload.message as string) || 'New alert',
              (item.payload.category as string) || 'system',
              item.payload
            );
          }
        }

        await notificationsRepository.markSent(item.id);
        succeeded++;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const nextAttempts = item.attempts + 1;

        if (nextAttempts >= 3) {
          await notificationsRepository.markPermanentlyFailed(item.id, nextAttempts, errorMsg);
        } else {
          // Exponential backoff: 2^attempts * 60 seconds (2m, 4m, 8m)
          const delaySec = Math.pow(2, nextAttempts) * 60;
          await notificationsRepository.recordRetry(item.id, nextAttempts, delaySec, errorMsg);
        }
        failed++;
      }
    }

    return { processed: pendingItems.length, succeeded, failed };
  }

  async getUserInbox(
    userId: string,
    orgId: string,
    unreadOnly = false
  ): Promise<InAppNotificationItem[]> {
    return await notificationsRepository.findInAppByUser(userId, orgId, unreadOnly);
  }

  async markAsRead(notificationId: string, userId: string): Promise<InAppNotificationItem | null> {
    return await notificationsRepository.markInAppRead(notificationId, userId);
  }
}

export const notificationsService = new NotificationsService();
