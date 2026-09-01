import { NextRequest, NextResponse } from 'next/server';
import { CreatePublicInquirySchema } from '@crystal/validation';
import { listPublicInquiriesDb, savePublicInquiryDb } from '@/lib/db';
import type { PublicInquiry } from '@crystal/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/inquiries
 * Retrieves all inquiries from PostgreSQL, optionally filtered by org_id or state_code.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('org_id') || undefined;
  const stateCode = searchParams.get('state_code') || undefined;

  const results = await listPublicInquiriesDb(orgId, stateCode);
  return NextResponse.json({
    success: true,
    data: results,
    count: results.length,
  });
}

/**
 * POST /api/v1/inquiries
 * Submits a public inquiry/lead and persists to PostgreSQL.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  const validationResult = CreatePublicInquirySchema.safeParse(body);
  if (!validationResult.success) {
    const formattedErrors: Record<string, string[]> = {};
    validationResult.error.errors.forEach((err) => {
      const field = err.path.join('.') || 'root';
      if (!formattedErrors[field]) formattedErrors[field] = [];
      formattedErrors[field].push(err.message);
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        fieldErrors: formattedErrors,
      },
      { status: 422 }
    );
  }

  const data = validationResult.data;

  // Honeypot spam check
  if (data.honeypot && data.honeypot.trim() !== '') {
    return NextResponse.json({ success: true, inquiry_id: 'noop' }, { status: 200 });
  }

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  const newInquiry: PublicInquiry = {
    id: `inq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    org_id: data.org_id,
    state_code: data.state_code,
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    inquiry_type: data.inquiry_type,
    message: data.message,
    source_url: data.source_url,
    ip_address: clientIp,
    status: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await savePublicInquiryDb(newInquiry);

  return NextResponse.json(
    {
      success: true,
      inquiry_id: newInquiry.id,
      message: 'Inquiry received successfully.',
    },
    { status: 201 }
  );
}
