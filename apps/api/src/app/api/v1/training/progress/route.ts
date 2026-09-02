import { NextRequest, NextResponse } from 'next/server';
import { updateTrainingProgressDb } from '@/lib/db';
import { UpdateVideoProgressSchema } from '@crystal/validation';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/training/progress
 * Heartbeat endpoint recording caregiver video lesson watch progress.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = UpdateVideoProgressSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { caregiver_id, module_id, watch_progress_seconds, total_duration_seconds } = parsed.data;

    const progress = await updateTrainingProgressDb(
      caregiver_id,
      module_id,
      watch_progress_seconds,
      total_duration_seconds
    );

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (err) {
    console.error('[Training Progress POST Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update video progress.',
      },
      { status: 500 }
    );
  }
}
