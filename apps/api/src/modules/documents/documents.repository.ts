import { db } from '../../db/index.js';
import type { CaregiverDocument } from '@crystal/types';
import type { CreateDocumentRecordParams, DocumentReviewParams } from './documents.types.js';

export class DocumentsRepository {
  async insertDocument(params: CreateDocumentRecordParams): Promise<CaregiverDocument> {
    const query = `
      INSERT INTO public.caregiver_documents (
        caregiver_id, org_id, category, storage_path, file_name, file_size_bytes, mime_type,
        issue_date, expiration_date, has_no_expiration, verification_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'under_review')
      RETURNING *;
    `;
    const values = [
      params.caregiverId,
      params.orgId,
      params.category,
      params.storagePath,
      params.fileName,
      params.fileSizeBytes,
      params.mimeType,
      params.issueDate || null,
      params.expirationDate || null,
      params.hasNoExpiration || false,
    ];

    const res = await db.query(query, values);
    return res.rows[0];
  }

  async findById(id: string): Promise<CaregiverDocument | null> {
    const res = await db.query(
      `SELECT * FROM public.caregiver_documents WHERE id = $1 AND is_archived = false;`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findByCaregiver(caregiverId: string): Promise<CaregiverDocument[]> {
    const res = await db.query(
      `SELECT * FROM public.caregiver_documents
       WHERE caregiver_id = $1 AND is_archived = false
       ORDER BY created_at DESC;`,
      [caregiverId]
    );
    return res.rows;
  }

  async findByCaregiverAndCategory(caregiverId: string, category: string): Promise<CaregiverDocument | null> {
    const res = await db.query(
      `SELECT * FROM public.caregiver_documents
       WHERE caregiver_id = $1 AND category = $2 AND is_archived = false
       ORDER BY created_at DESC
       LIMIT 1;`,
      [caregiverId, category]
    );
    return res.rows[0] || null;
  }

  async updateReviewStatus(params: DocumentReviewParams): Promise<CaregiverDocument | null> {
    const query = `
      UPDATE public.caregiver_documents
      SET verification_status = $1,
          rejection_reason = $2,
          reviewed_by = $3,
          reviewed_at = NOW()
      WHERE id = $4 AND is_archived = false
      RETURNING *;
    `;
    const values = [
      params.verificationStatus,
      params.rejectionReason || null,
      params.reviewerId,
      params.documentId,
    ];

    const res = await db.query(query, values);
    return res.rows[0] || null;
  }

  async insertDocAuditLog(
    documentId: string,
    userId: string | undefined,
    action: string,
    ipAddress?: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    await db.query(
      `INSERT INTO public.document_audit_logs (document_id, user_id, action, ip_address, metadata)
       VALUES ($1, $2, $3, $4, $5);`,
      [documentId, userId || null, action, ipAddress || null, JSON.stringify(metadata)]
    );
  }

  async findExpiringDocuments(): Promise<(CaregiverDocument & { user_id?: string; personal_info?: any })[]> {
    const res = await db.query(
      `SELECT d.*, c.user_id, c.personal_info
       FROM public.caregiver_documents d
       JOIN public.caregiver_profiles c ON d.caregiver_id = c.id
       WHERE d.expiration_date IS NOT NULL
         AND d.has_no_expiration = false
         AND d.is_archived = false
         AND d.expiration_date <= NOW() + INTERVAL '30 days'
       ORDER BY d.expiration_date ASC;`
    );
    return res.rows;
  }

  async markExpired(documentId: string): Promise<void> {
    await db.query(
      `UPDATE public.caregiver_documents
       SET verification_status = 'expired'
       WHERE id = $1 AND verification_status != 'expired';`,
      [documentId]
    );
  }
}

export const documentsRepository = new DocumentsRepository();
