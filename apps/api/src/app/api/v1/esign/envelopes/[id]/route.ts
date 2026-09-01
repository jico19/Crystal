import { NextRequest, NextResponse } from 'next/server';
import { getSignatureEnvelopeDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/esign/envelopes/[id]
 * Retrieves a single signature envelope by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const envelope = await getSignatureEnvelopeDb(id);

  if (!envelope) {
    return NextResponse.json(
      { success: false, error: 'Signature envelope not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, envelope });
}
