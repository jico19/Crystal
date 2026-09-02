import { NextRequest, NextResponse } from 'next/server';
import { getTrainingComplianceSummaryDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/training/compliance-summary
 * Returns caregiver training compliance summary, earned CEU hours,
 * mandatory module completion status, and state requirement compliance.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caregiverId = searchParams.get('caregiver_id') || request.headers.get('x-user-id');
    const stateCode = searchParams.get('state_code') || 'GA';

    if (!caregiverId) {
      return NextResponse.json(
        { success: false, error: 'Missing required query param: caregiver_id' },
        { status: 400 }
      );
    }

    const summary = await getTrainingComplianceSummaryDb(caregiverId, stateCode);

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (err) {
    console.error('[Training Compliance Summary Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to retrieve compliance summary.',
      },
      { status: 500 }
    );
  }
}
