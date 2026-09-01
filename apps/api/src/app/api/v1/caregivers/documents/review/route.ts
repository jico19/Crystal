import { NextRequest, NextResponse } from 'next/server';
import { DocumentReviewSchema } from '@crystal/validation';
import { reviewCaregiverDocumentDb, logDocumentAuditDb } from '@/lib/db';

/**
 * POST /api/v1/caregivers/documents/review
 * Approves or rejects a caregiver credential with audit trail logging.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const validation = DocumentReviewSchema.safeParse(body);

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

    const { document_id, decision, rejection_reason, corrected_expiration_date } =
      validation.data;
    const verifiedBy =
      (body.verified_by as string) ||
      request.headers.get('x-user-id') ||
      'staff_coordinator';

    const updatedDoc = await reviewCaregiverDocumentDb({
      document_id,
      decision,
      rejection_reason,
      verified_by: verifiedBy,
      corrected_expiration_date,
    });

    if (!updatedDoc) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Write immutable audit trail
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Crystal-Staff-Review/1.0';
    await logDocumentAuditDb({
      document_id,
      user_id: verifiedBy,
      action: decision === 'approved' ? 'APPROVE' : 'REJECT',
      ip_address: ip,
      user_agent: userAgent,
    });

    return NextResponse.json({
      success: true,
      document: updatedDoc,
      message: `Document successfully ${decision}.`,
    });
  } catch (err) {
    console.error('[Document Review Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to submit document review.',
      },
      { status: 500 }
    );
  }
}
