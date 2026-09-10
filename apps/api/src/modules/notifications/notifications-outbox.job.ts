import { notificationsService } from './notifications.service.js';

/**
 * Scheduled job to process queued outbox notifications.
 * Runs every minute or at specified interval.
 */
export async function runOutboxProcessingScan(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  try {
    const result = await notificationsService.processOutboxBatch();
    if (result.processed > 0) {
      console.log(
        `📬 [Notification Outbox] Processed ${result.processed} items (${result.succeeded} sent, ${result.failed} retrying/failed).`
      );
    }
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`⚠️ [Notification Outbox] Batch processor failure: ${msg}`);
    return { processed: 0, succeeded: 0, failed: 0 };
  }
}

let outboxInterval: NodeJS.Timeout | null = null;

export function startNotificationOutboxJob(intervalMs: number = 60 * 1000): void {
  if (outboxInterval) return;
  outboxInterval = setInterval(runOutboxProcessingScan, intervalMs);
}

export function stopNotificationOutboxJob(): void {
  if (outboxInterval) {
    clearInterval(outboxInterval);
    outboxInterval = null;
  }
}
