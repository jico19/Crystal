import { NextRequest, NextResponse } from 'next/server';
import { listClientDocumentsDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/clients/[id]/documents
 * Lists all documents ingested for a given client.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const documents = await listClientDocumentsDb(id);

    return NextResponse.json({
      success: true,
      documents,
      total_count: documents.length,
    });
  } catch (err) {
    console.error('[Client Documents List Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to retrieve client documents.',
      },
      { status: 500 }
    );
  }
}
