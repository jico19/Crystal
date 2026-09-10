import { authorizationsService } from './authorizations.service.js';

/**
 * Scheduled job to scan and update prior authorizations based on expiration dates.
 * - Marks end_date < TODAY as 'expired'
 * - Marks end_date <= TODAY + 30 days as 'expiring_soon'
 */
export async function runAuthorizationExpirationScan(): Promise<{
  expiredCount: number;
  expiringSoonCount: number;
}> {
  try {
    const result = await authorizationsService.runExpirationCheck();
    if (result.expiredCount > 0 || result.expiringSoonCount > 0) {
      console.log(
        `⏱️ [Authorization Monitor] Expiration scan: ${result.expiredCount} marked expired, ${result.expiringSoonCount} marked expiring_soon.`
      );
    }
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`⚠️ [Authorization Monitor] Expiration scan failed: ${msg}`);
    return { expiredCount: 0, expiringSoonCount: 0 };
  }
}

let scanInterval: NodeJS.Timeout | null = null;

export function startAuthorizationExpirationJob(intervalMs: number = 60 * 60 * 1000): void {
  if (scanInterval) return;
  // Run once immediately
  runAuthorizationExpirationScan();
  // Schedule periodic checks
  scanInterval = setInterval(runAuthorizationExpirationScan, intervalMs);
}

export function stopAuthorizationExpirationJob(): void {
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }
}
