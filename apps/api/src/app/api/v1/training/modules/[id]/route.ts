import { NextRequest, NextResponse } from 'next/server';
import { getTrainingModuleDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/training/modules/[id]
 * Retrieves full details and quiz knowledge check questions for a training module.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const moduleItem = await getTrainingModuleDb(id);

    if (!moduleItem) {
      return NextResponse.json(
        { success: false, error: `Training module ${id} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      module: moduleItem,
    });
  } catch (err) {
    console.error('[Training Module Detail GET Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to retrieve training module.',
      },
      { status: 500 }
    );
  }
}
