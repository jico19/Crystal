import { NextRequest, NextResponse } from 'next/server';
import { getAdminWorkQueuesDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/queues
 * Returns actionable items requiring review across document verification,
 * caregiver application admissions, and expiring prior authorizations.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stateCode = searchParams.get('state_code') || undefined;

    const queues = await getAdminWorkQueuesDb(stateCode);

    return NextResponse.json({
      success: true,
      queues,
      total_count: queues.length,
    });
  } catch (err) {
    console.error('[Admin Queues GET Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to retrieve admin work queues.',
      },
      { status: 500 }
    );
  }
}
