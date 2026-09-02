import { NextRequest, NextResponse } from 'next/server';
import { getClientAuthorizationByIdDb } from '@/lib/db';
import { storeComputeAuthSummary } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/authorizations/[id]
 * Retrieves details and utilization burn-down metrics for a single authorization.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const auth = await getClientAuthorizationByIdDb(id);

    if (!auth) {
      return NextResponse.json(
        { success: false, error: `Authorization ${id} not found.` },
        { status: 404 }
      );
    }

    const summary = storeComputeAuthSummary(auth);

    return NextResponse.json({
      success: true,
      authorization: {
        ...auth,
        summary,
      },
    });
  } catch (err) {
    console.error('[Authorization Detail GET Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to retrieve authorization.',
      },
      { status: 500 }
    );
  }
}
