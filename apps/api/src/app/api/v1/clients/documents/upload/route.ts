import { NextRequest, NextResponse } from 'next/server';
import { uploadClientDocumentDb } from '@/lib/db';
import { ClientDocumentUploadSchema } from '@crystal/validation';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/clients/documents/upload
 * Ingests admission documents, physician orders (485), or legal POA forms for a client.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = ClientDocumentUploadSchema.safeParse(rawBody);

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

    const {
      client_id,
      org_id,
      doc_type,
      file_name,
      file_size_bytes,
      mime_type,
      effective_date,
      expiration_date,
    } = parsed.data;

    const storagePath = `clients/${client_id}/${doc_type}_${Date.now()}_${file_name}`;

    const uploadedDoc = await uploadClientDocumentDb({
      client_id,
      org_id,
      doc_type,
      file_storage_path: storagePath,
      file_name,
      file_size_bytes,
      mime_type,
      effective_date: effective_date || undefined,
      expiration_date: expiration_date || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        document: uploadedDoc,
        message: 'Client document uploaded successfully.',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[Client Document Upload Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to upload client document.',
      },
      { status: 500 }
    );
  }
}
