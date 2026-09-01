import { NextRequest, NextResponse } from 'next/server';
import { DocumentUploadSchema } from '@crystal/validation';
import { saveCaregiverDocumentDb, logDocumentAuditDb } from '@/lib/db';
import { parseDocumentOCR } from '@/lib/ocr';

/**
 * POST /api/v1/caregivers/documents/upload
 * Handles document upload, automated OCR extraction, and audit trail logging.
 */
export async function POST(request: NextRequest) {
  try {
    let body: any;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      // Fallback FormData parsing
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      body = {
        caregiver_id: formData.get('caregiver_id'),
        org_id: formData.get('org_id'),
        category: formData.get('category'),
        file_name: file ? file.name : formData.get('file_name'),
        file_size_bytes: file ? file.size : Number(formData.get('file_size_bytes')),
        mime_type: file ? file.type : formData.get('mime_type'),
        issue_date: formData.get('issue_date') || undefined,
        expiration_date: formData.get('expiration_date') || undefined,
        has_no_expiration: formData.get('has_no_expiration') === 'true',
      };
    }

    const validation = DocumentUploadSchema.safeParse(body);
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

    const {
      caregiver_id,
      category,
      file_name,
      file_size_bytes,
      mime_type,
      file_base64,
      issue_date,
      expiration_date,
      has_no_expiration,
    } = validation.data;

    const orgId =
      (body.org_id as string) ||
      request.headers.get('x-org-id') ||
      '00000000-0000-0000-0000-000000000001';

    // 1. Run Automated OCR Extraction
    const ocrData = await parseDocumentOCR({
      fileName: file_name,
      category,
    });

    const finalIssueDate = issue_date || ocrData.issue_date;
    const finalExpDate = has_no_expiration
      ? undefined
      : expiration_date || ocrData.expiration_date;

    const storagePath = `org_${orgId}/caregivers/${caregiver_id}/${category}-${Date.now()}-${file_name}`;

    // 2. Persist Document in PostgreSQL
    const savedDoc = await saveCaregiverDocumentDb({
      caregiver_id,
      org_id: orgId,
      category,
      file_storage_path: storagePath,
      file_name,
      file_size_bytes,
      mime_type,
      issue_date: finalIssueDate,
      expiration_date: finalExpDate,
      has_no_expiration: has_no_expiration || false,
      verification_status: 'under_review',
      ocr_extracted_data: ocrData,
    });

    // 3. Write Immutable Audit Log
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Crystal-Client';
    await logDocumentAuditDb({
      document_id: savedDoc.id,
      user_id: caregiver_id,
      action: 'UPLOAD',
      ip_address: ip,
      user_agent: userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        document: savedDoc,
        message: 'Document uploaded successfully and queued for review.',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[Document Upload Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to process document upload.',
      },
      { status: 500 }
    );
  }
}
