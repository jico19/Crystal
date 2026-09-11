import type { Request, Response } from 'express';
import { notificationsService } from './notifications.service.js';
import { QueueNotificationSchema } from '@crystal/validation';
import { AppError } from '../../lib/errors.js';

export class NotificationsController {
  async dispatchNotification(req: Request, res: Response): Promise<void> {
    const orgId = req.orgId || req.body.org_id;
    const parsed = QueueNotificationSchema.safeParse({
      ...req.body,
      org_id: orgId,
    });

    if (!parsed.success) {
      throw AppError.unprocessable('Validation failed', parsed.error.flatten().fieldErrors);
    }

    const item = await notificationsService.queueNotification(parsed.data);
    res.status(202).json({
      message: 'Notification queued for delivery',
      item,
    });
  }

  async processOutbox(_req: Request, res: Response): Promise<void> {
    const result = await notificationsService.processOutboxBatch();
    res.status(200).json(result);
  }

  async getInbox(req: Request, res: Response): Promise<void> {
    const orgId = req.orgId || req.user?.org_id;
    if (!orgId) {
      throw AppError.badRequest('Organization context required');
    }
    const unreadOnly = req.query.unread === 'true';

    const items = await notificationsService.getUserInbox(req.user!.id, orgId, unreadOnly);
    res.status(200).json(items);
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    const notificationId = String(req.params.id);

    const updated = await notificationsService.markAsRead(notificationId, req.user!.id);
    if (!updated) {
      throw AppError.notFound('Notification not found');
    }

    res.status(200).json(updated);
  }
}

export const notificationsController = new NotificationsController();

