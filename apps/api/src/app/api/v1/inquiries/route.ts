import { NextResponse } from 'next/server';
import { CreatePublicInquirySchema } from '@crystal/validation';
import { mockInquiries } from '@/lib/store';
import type { PublicInquiry } from '@crystal/types';

// GET /api/v1/inquiries (Supports optional ?state_code=GA or ?state_code=IN)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stateCode = searchParams.get('state_code');

  let results = [...mockInquiries];
  if (stateCode) {
    results = results.filter((item) => item.state_code.toUpperCase() === stateCode.toUpperCase());
  }

  // Sort descending by created_at
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({
    success: true,
    total: results.length,
    data: results,
  });
}

// POST /api/v1/inquiries (Submit new public lead)
export async function POST(request: Request) {
  try {
    const rawBody = await request.json();

    // Server-side Zod validation
    const validation = CreatePublicInquirySchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          fieldErrors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { honeypot, ...payload } = validation.data;

    // Silent drop for automated spam bots
    if (honeypot && honeypot.length > 0) {
      return NextResponse.json({ success: true, data: { inquiryId: 'noop' } });
    }

    const newInquiry: PublicInquiry = {
      id: `inq-${Date.now()}`,
      org_id: payload.org_id,
      state_code: payload.state_code,
      full_name: payload.full_name,
      email: payload.email,
      phone: payload.phone,
      inquiry_type: payload.inquiry_type,
      message: payload.message,
      source_url: payload.source_url,
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockInquiries.unshift(newInquiry);

    return NextResponse.json(
      {
        success: true,
        message: 'Inquiry received and queued for state care coordinators.',
        data: { inquiryId: newInquiry.id },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error processing inquiry.',
      },
      { status: 500 }
    );
  }
}
