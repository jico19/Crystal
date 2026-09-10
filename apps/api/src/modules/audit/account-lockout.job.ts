import { db } from '../../db/index.js';
import { auditService } from './audit.service.js';

/**
 * Checks for brute-force login attempts (>= 5 failed attempts in 15 minutes)
 * and locks the affected accounts.
 */
export async function checkAccountLockouts(): Promise<number> {
  try {
    // Find users with 5 or more AUTH_FAILED events in the last 15 minutes who are still active
    const findQuery = `
      SELECT sal.user_id, count(*)::int as failure_count
      FROM public.security_audit_logs sal
      JOIN public.user_profiles up ON up.id = sal.user_id
      WHERE sal.event_type = 'AUTH_FAILED'
        AND sal.created_at >= NOW() - INTERVAL '15 minutes'
        AND up.is_active = true
      GROUP BY sal.user_id
      HAVING count(*) >= 5;
    `;

    const res = await db.query(findQuery);
    let lockedCount = 0;

    for (const row of res.rows) {
      const userId = row.user_id;

      // Deactivate account and set lockout timestamp
      await db.query(
        `UPDATE public.user_profiles
         SET is_active = false,
             locked_until = NOW() + INTERVAL '15 minutes',
             failed_login_attempts = $1
         WHERE id = $2;`,
        [row.failure_count, userId]
      );

      // Record AUTH_LOCKOUT audit event
      await auditService.logAuditEvent({
        userId,
        eventType: 'AUTH_LOCKOUT',
        resourceType: 'user_profiles',
        resourceId: userId,
        metadata: {
          reason: 'Excessive failed login attempts (> 5 in 15 minutes)',
          failureCount: row.failure_count,
        },
      });

      console.warn(`🔒 [Security Monitor] User profile [${userId}] locked due to brute-force detection.`);
      lockedCount++;
    }

    return lockedCount;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`⚠️ [AccountLockoutJob] Error executing account lockout check: ${msg}`);
    return 0;
  }
}

/**
 * Start background timer running every 5 minutes
 */
export function startAccountLockoutMonitor(intervalMs: number = 5 * 60 * 1000): NodeJS.Timeout {
  console.log(`🛡️ [Security Monitor] Account lockout monitor initialized (interval: ${intervalMs / 1000}s)`);
  return setInterval(async () => {
    await checkAccountLockouts();
  }, intervalMs);
}
