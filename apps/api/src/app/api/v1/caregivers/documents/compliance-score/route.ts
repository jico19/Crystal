import { NextRequest, NextResponse } from 'next/server';
import { getComplianceScoreDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/caregivers/documents/compliance-score
 * Returns compliance percentage, breakdown, missing docs, and expiring warnings.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caregiverId =
      searchParams.get('caregiver_id') ||
      searchParams.get('user_id') ||
      request.headers.get('x-user-id');

    if (!caregiverId) {
      return NextResponse.json(
        { success: false, error: 'Missing required query param: caregiver_id' },
        { status: 400 }
      );
    }

    const score = await getComplianceScoreDb(caregiverId);

    return NextResponse.json({
      success: true,
      compliance_score: score,
    });
  } catch (err) {
    console.error('[Compliance Score GET Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to calculate compliance score.',
      },
      { status: 500 }
    );
  }
}
