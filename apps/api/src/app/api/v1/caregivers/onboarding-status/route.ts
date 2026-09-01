import { NextRequest, NextResponse } from 'next/server';
import { getCaregiverProfileDb } from '@/lib/db';
import type { StateCode } from '@crystal/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/caregivers/onboarding-status
 * Returns full onboarding checklist and application status for a caregiver from PostgreSQL.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const orgId = searchParams.get('org_id');
  const stateCode = searchParams.get('state_code') as StateCode;

  if (!userId || !orgId || !stateCode) {
    return NextResponse.json(
      { success: false, error: 'Missing required params: user_id, org_id, state_code' },
      { status: 400 }
    );
  }

  const profile = await getCaregiverProfileDb(userId);
  if (!profile) {
    return NextResponse.json(
      { success: false, error: 'No application found for this user.' },
      { status: 404 }
    );
  }

  const checklist = profile.onboarding_checklist;
  const statuses = Object.values(checklist);
  const verifiedCount = statuses.filter((s) => s === 'verified').length;
  const completionPercentage = Math.round((verifiedCount / statuses.length) * 100);

  return NextResponse.json({
    success: true,
    application_status: profile.application_status,
    application_step: profile.application_step,
    submitted_at: profile.submitted_at,
    approved_at: profile.approved_at,
    onboarding_checklist: checklist,
    completion_percentage: completionPercentage,
    assigned_coordinator_id: profile.assigned_coordinator_id ?? null,
  });
}
