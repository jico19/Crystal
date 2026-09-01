import { NextRequest, NextResponse } from 'next/server';
import { getCaregiverDocumentsDb } from '@/lib/db';
import type { DocumentCategoryType } from '@crystal/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/caregivers/documents
 * Lists all active documents for a given caregiver.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caregiverId =
      searchParams.get('caregiver_id') ||
      searchParams.get('user_id') ||
      request.headers.get('x-user-id');

    if (!caregiverId) {
      return NextResponse.json(
        { success: false, error: 'Missing required query param: caregiver_id' },
        { status: 400 }
      );
    }

    const category = searchParams.get('category') as DocumentCategoryType | undefined;
    const docs = await getCaregiverDocumentsDb(caregiverId, category || undefined);

    return NextResponse.json({
      success: true,
      documents: docs,
      total_count: docs.length,
    });
  } catch (err) {
    console.error('[Documents GET Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to retrieve documents.',
      },
      { status: 500 }
    );
  }
}
