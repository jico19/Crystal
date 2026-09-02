import { NextRequest, NextResponse } from 'next/server';
import { listTrainingModulesDb, getCaregiverTrainingProgressDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/training/modules
 * Retrieves catalog of active state-mandated training modules.
 * Optional query params:
 * - state_code: 'GA' | 'IN' | 'ALL'
 * - caregiver_id: attaches progress and completion status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stateCode = searchParams.get('state_code') || undefined;
    const caregiverId = searchParams.get('caregiver_id') || undefined;

    const modules = await listTrainingModulesDb(stateCode);

    if (caregiverId) {
      const progressList = await getCaregiverTrainingProgressDb(caregiverId);
      const progressMap = new Map(progressList.map((p) => [p.module_id, p]));

      const enrichedModules = modules.map((m) => ({
        ...m,
        progress: progressMap.get(m.id) || {
          watch_progress_percentage: 0,
          video_completed: false,
          quiz_attempts: 0,
          passed: false,
        },
      }));

      return NextResponse.json({
        success: true,
        modules: enrichedModules,
        total_count: enrichedModules.length,
      });
    }

    return NextResponse.json({
      success: true,
      modules,
      total_count: modules.length,
    });
  } catch (err) {
    console.error('[Training Modules GET Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to retrieve training modules.',
      },
      { status: 500 }
    );
  }
}
