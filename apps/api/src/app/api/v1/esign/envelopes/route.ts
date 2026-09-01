import { NextRequest, NextResponse } from 'next/server';
import { CreateEnvelopeRequestSchema } from '@crystal/validation';
import { createSignatureEnvelopeDb, listSignatureEnvelopesDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/esign/envelopes
 * Lists signature envelopes, optionally filtered by org_id.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('org_id') || undefined;

  const envelopes = await listSignatureEnvelopesDb(orgId);
  return NextResponse.json({
    success: true,
    data: envelopes,
    count: envelopes.length,
  });
}

/**
 * POST /api/v1/esign/envelopes
 * Creates a new e-signature envelope in PostgreSQL.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = CreateEnvelopeRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  const data = validation.data;
  const envelope = await createSignatureEnvelopeDb({
    org_id: data.org_id,
    template_type: data.template_type,
    signer_name: data.signer_name,
    signer_email: data.signer_email,
    signer_user_id: data.signer_user_id,
  });

  return NextResponse.json(
    {
      success: true,
      envelope,
      message: 'Signature envelope created successfully.',
    },
    { status: 201 }
  );
}
