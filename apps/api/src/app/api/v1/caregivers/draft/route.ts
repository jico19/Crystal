import { NextRequest, NextResponse } from 'next/server';
import { SaveCaregiverDraftSchema } from '@crystal/validation';
import { getCaregiverProfileDb, saveCaregiverDraftDb } from '@/lib/db';
import type { StateCode } from '@crystal/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/caregivers/draft
 * Returns the current caregiver draft profile for the requesting user from PostgreSQL.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || request.headers.get('x-user-id');
    const orgId = searchParams.get('org_id') || request.headers.get('x-org-id');
    const stateCode = (searchParams.get('state_code') || request.headers.get('x-state-code')) as StateCode;

    if (!userId || !orgId || !stateCode) {
      return NextResponse.json(
        { success: false, error: 'Missing required params: user_id, org_id, state_code' },
        { status: 400 }
      );
    }

    let profile = await getCaregiverProfileDb(userId);
    if (!profile) {
      profile = await saveCaregiverDraftDb(userId, orgId, stateCode, 1, {});
    }

    // Strip encrypted SSN before returning to client
    const safeProfile = {
      ...profile,
      personal_info: profile.personal_info
        ? { ...profile.personal_info, ssn_encrypted: undefined }
        : {},
    };

    return NextResponse.json({ success: true, profile: safeProfile });
  } catch (err: any) {
    console.error('[Caregivers Draft GET Error]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/caregivers/draft
 * Saves a draft for a specific application step into PostgreSQL.
 * Handles SSN sanitization on Step 1.
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const validation = SaveCaregiverDraftSchema.safeParse(body);
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

    const { step, org_id, state_code, data } = validation.data;

    // In production: resolve userId from auth JWT. Here: from request body or header.
    const userId = (data.user_id as string) || request.headers.get('x-user-id') || 'anonymous';
    const updated = await saveCaregiverDraftDb(
      userId,
      org_id,
      state_code as StateCode,
      step,
      data
    );

    const safeProfile = {
      ...updated,
      personal_info: { ...updated.personal_info, ssn_encrypted: undefined },
    };

    return NextResponse.json({ success: true, profile: safeProfile });
  } catch (err: any) {
    console.error('[Caregivers Draft POST Error]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
