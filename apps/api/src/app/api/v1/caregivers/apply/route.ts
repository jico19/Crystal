import { NextRequest, NextResponse } from 'next/server';
import { LegalDisclosuresStepSchema } from '@crystal/validation';
import { getCaregiverProfileDb, submitCaregiverApplicationDb } from '@/lib/db';
import type { LegalDisclosures } from '@crystal/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/caregivers/apply
 * Final submission endpoint. Validates Step 5 legal disclosures,
 * marks status as 'submitted' in PostgreSQL, and updates onboarding checklist.
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    // Extract userId before full validation (needed to lookup profile)
    const rawBody = body as Record<string, unknown>;
    const userId = (rawBody.user_id as string) || request.headers.get('x-user-id') || 'anonymous';

    // Validate Step 5 legal disclosures inline
    const legalValidation = LegalDisclosuresStepSchema.safeParse(rawBody.legal_disclosures);
    if (!legalValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Legal disclosure validation failed',
          fieldErrors: legalValidation.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const profile = await getCaregiverProfileDb(userId);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'No application draft found. Please start from Step 1.' },
        { status: 404 }
      );
    }

    const updated = await submitCaregiverApplicationDb(
      userId,
      legalValidation.data as unknown as Partial<LegalDisclosures>
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    console.log(`[Crystal] Caregiver application submitted: user=${userId}, org=${profile.org_id}`);

    return NextResponse.json({
      success: true,
      application_id: updated.id,
      message: 'Application submitted successfully. You will receive a confirmation email shortly.',
    });
  } catch (err: any) {
    console.error('[Caregivers Apply POST Error]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
