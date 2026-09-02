import { NextRequest, NextResponse } from 'next/server';
import { listClientsDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/clients
 * Lists clients filtered by organization or state code.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id') || undefined;
    const stateCode = searchParams.get('state_code') || undefined;

    const clients = await listClientsDb(orgId, stateCode);

    return NextResponse.json({
      success: true,
      clients,
      total_count: clients.length,
    });
  } catch (err) {
    console.error('[Clients GET Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to retrieve clients.',
      },
      { status: 500 }
    );
  }
}
