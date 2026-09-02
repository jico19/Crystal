import { NextRequest, NextResponse } from 'next/server';
import {
  createClientAuthorizationDb,
  getClientAuthorizationsDb,
} from '@/lib/db';
import { storeComputeAuthSummary } from '@/lib/store';
import { ClientAuthorizationSchema } from '@crystal/validation';
import type { AuthStatusType } from '@crystal/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/authorizations
 * Lists client prior authorizations filtered by client_id, org_id, or status.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id') || undefined;
    const orgId = searchParams.get('org_id') || request.headers.get('x-org-id') || undefined;
    const status = (searchParams.get('status') as AuthStatusType) || undefined;

    const authorizations = await getClientAuthorizationsDb(clientId, orgId, status);

    const enriched = authorizations.map((auth) => ({
      ...auth,
      summary: storeComputeAuthSummary(auth),
    }));

    return NextResponse.json({
      success: true,
      authorizations: enriched,
      total_count: enriched.length,
    });
  } catch (err) {
    console.error('[Authorizations GET Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to retrieve authorizations.',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/authorizations
 * Creates a new client prior authorization with procedure code and units cap.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = ClientAuthorizationSchema.safeParse(rawBody);

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

    const created = await createClientAuthorizationDb(parsed.data);
    const summary = storeComputeAuthSummary(created);

    return NextResponse.json(
      {
        success: true,
        authorization: {
          ...created,
          summary,
        },
        message: 'Client authorization created successfully.',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[Authorizations POST Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create authorization.',
      },
      { status: 500 }
    );
  }
}
