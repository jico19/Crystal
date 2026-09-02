import { NextRequest, NextResponse } from 'next/server';
import { logAuthorizationUtilizationDb } from '@/lib/db';
import { LogUtilizationSchema } from '@crystal/validation';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/authorizations/[id]/utilize
 * Logs caregiver visit units consumed against an active authorization.
 * 1 unit = 15 minutes (4 units = 1 hour).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const rawBody = await request.json();
    const parsed = LogUtilizationSchema.safeParse(rawBody);

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

    const result = await logAuthorizationUtilizationDb(id, parsed.data);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to log utilization.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      authorization: result.authorization,
      summary: result.summary,
      message: `Successfully logged ${parsed.data.units_to_log} units (${(parsed.data.units_to_log / 4).toFixed(2)} hours).`,
    });
  } catch (err) {
    console.error('[Authorization Utilization POST Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to record utilization.',
      },
      { status: 500 }
    );
  }
}
