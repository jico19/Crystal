import { NextRequest, NextResponse } from 'next/server';
import { getExpiringAuthorizationsDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/authorizations/expiring
 * Retrieves authorizations that are expiring soon (<= 60 days) or exhausted,
 * enabling proactive case manager renewal notifications.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id') || request.headers.get('x-org-id') || undefined;
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!, 10) : 60;

    const expiring = await getExpiringAuthorizationsDb(orgId, days);

    return NextResponse.json({
      success: true,
      authorizations: expiring,
      total_count: expiring.length,
      days_threshold: days,
    });
  } catch (err) {
    console.error('[Expiring Authorizations GET Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to retrieve expiring authorizations.',
      },
      { status: 500 }
    );
  }
}
