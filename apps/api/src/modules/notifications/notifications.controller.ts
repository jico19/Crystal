import type { Request, Response } from 'express';
import { notificationsService } from './notifications.service.js';
import { QueueNotificationSchema } from '@crystal/validation';

export class NotificationsController {
  async dispatchNotification(req: Request, res: Response): Promise<void> {
    try {
      const orgId = (req as any).orgId || req.body.org_id;
      const parsed = QueueNotificationSchema.safeParse({
        ...req.body,
        org_id: orgId,
      });

      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.issues,
        });
        return;
      }

      const item = await notificationsService.queueNotification(parsed.data);
      res.status(202).json({
        message: 'Notification queued for delivery',
        item,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }

  async processOutbox(req: Request, res: Response): Promise<void> {
    try {
      const result = await notificationsService.processOutboxBatch();
      res.status(200).json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }

  async getInbox(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const orgId = (req as any).orgId;
      const unreadOnly = req.query.unread === 'true';

      const items = await notificationsService.getUserInbox(user.id, orgId, unreadOnly);
      res.status(200).json(items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const notificationId = String(req.params.id);

      const updated = await notificationsService.markAsRead(notificationId, user.id);
      if (!updated) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      res.status(200).json(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  }
}

export const notificationsController = new NotificationsController();
