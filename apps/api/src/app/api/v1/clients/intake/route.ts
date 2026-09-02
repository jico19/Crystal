import { NextRequest, NextResponse } from 'next/server';
import { createClientProfileDb } from '@/lib/db';
import { ClientIntakeSchema } from '@crystal/validation';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/clients/intake
 * Submits prospective client digital intake packet with demographics,
 * emergency contacts, physician orders, care needs (ADLs/IADLs), and payer details.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = ClientIntakeSchema.safeParse(rawBody);

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

    const client = await createClientProfileDb(parsed.data);

    return NextResponse.json(
      {
        success: true,
        client,
        message: 'Client intake submitted successfully.',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[Client Intake POST Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to submit client intake.',
      },
      { status: 500 }
    );
  }
}
