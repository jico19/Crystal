import { NextRequest, NextResponse } from 'next/server';
import { getAdminDashboardMetricsDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/kpis
 * Returns aggregated executive KPI metrics across Georgia, Indiana, or all states.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stateCode = searchParams.get('state_code') || undefined;

    const metrics = await getAdminDashboardMetricsDb(stateCode);

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (err) {
    console.error('[Admin KPIs GET Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to retrieve admin KPIs.',
      },
      { status: 500 }
    );
  }
}
