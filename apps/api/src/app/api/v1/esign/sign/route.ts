import { NextRequest, NextResponse } from 'next/server';
import { CompleteSignatureSchema } from '@crystal/validation';
import { completeSignatureEnvelopeDb, getSignatureEnvelopeDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/esign/sign
 * Completes and cryptographically stamps an e-signature envelope in PostgreSQL.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = CompleteSignatureSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Signature validation failed',
        fieldErrors: validation.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  const { envelope_id, signature_base64 } = validation.data;

  const existing = await getSignatureEnvelopeDb(envelope_id);
  if (!existing) {
    return NextResponse.json(
      { success: false, error: 'Signature envelope not found' },
      { status: 404 }
    );
  }

  if (existing.status === 'completed') {
    return NextResponse.json(
      { success: false, error: 'Signature envelope has already been signed' },
      { status: 400 }
    );
  }

  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Crystal-Esign-Client/1.0';

  const completed = await completeSignatureEnvelopeDb(
    envelope_id,
    signature_base64,
    ipAddress,
    userAgent
  );

  if (!completed) {
    return NextResponse.json(
      { success: false, error: 'Failed to complete signature' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    envelope: completed,
    message: 'Document signed successfully with cryptographic SHA-256 seal.',
  });
}
