import { documentsService } from './documents.service.js';

/**
 * Scheduled job to scan and update caregiver documents based on expiration dates.
 * - Marks expiration_date < TODAY as 'expired'
 * - Auto-enqueues reminder notification for credentials expiring within 30 days
 */
export async function runCredentialExpirationScan(): Promise<{
  expiredCount: number;
  expiringSoonCount: number;
}> {
  try {
    const result = await documentsService.runCredentialExpirationCheck();
    if (result.expiredCount > 0 || result.expiringSoonCount > 0) {
      console.log(
        `⏱️ [Credential Monitor] Expiration scan: ${result.expiredCount} marked expired, ${result.expiringSoonCount} expiring within 30 days.`
      );
    }
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`⚠️ [Credential Monitor] Expiration scan failed: ${msg}`);
    return { expiredCount: 0, expiringSoonCount: 0 };
  }
}

let scanInterval: NodeJS.Timeout | null = null;

export function startCredentialExpirationJob(intervalMs: number = 60 * 60 * 1000): void {
  if (scanInterval) return;
  // Run once immediately on boot
  runCredentialExpirationScan();
  // Schedule periodic checks (defaults to hourly)
  scanInterval = setInterval(runCredentialExpirationScan, intervalMs);
}

export function stopCredentialExpirationJob(): void {
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }
}
