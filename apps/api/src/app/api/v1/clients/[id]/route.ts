import { NextRequest, NextResponse } from 'next/server';
import { getClientProfileDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/clients/[id]
 * Retrieves full details for a client profile.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const client = await getClientProfileDb(id);

    if (!client) {
      return NextResponse.json(
        { success: false, error: `Client ${id} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      client,
    });
  } catch (err) {
    console.error('[Client Detail GET Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to retrieve client.',
      },
      { status: 500 }
    );
  }
}
