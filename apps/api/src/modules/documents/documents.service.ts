import crypto from 'crypto';
import { documentsRepository } from './documents.repository.js';
import { getStorageProvider } from '../../integrations/storage/index.js';
import { auditService } from '../audit/audit.service.js';
import { notificationsService } from '../notifications/notifications.service.js';
import type { CaregiverDocument, ComplianceScore, AuthenticatedUser } from '@crystal/types';
import type { RequestUploadUrlInput, ReviewDocumentInput } from '@crystal/validation';

export class DocumentsService {
  // 7 mandatory document categories required for a caregiver to be compliant
  private mandatoryCategories = [
    'drivers_license',
    'social_security_card',
    'cpr_first_aid',
    'cna_hha_license',
    'tb_test_screen',
    'background_check_report',
    'w4_i9_form',
  ] as const;

  /**
   * Generates a presigned upload URL and inserts a document metadata row
   */
  async requestUploadUrl(
    input: RequestUploadUrlInput,
    user: AuthenticatedUser,
    orgId: string,
    ipAddress?: string
  ): Promise<{ uploadUrl: string; document: CaregiverDocument }> {
    const fileId = crypto.randomUUID();
    const cleanFileName = input.file_name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `caregivers/${input.caregiver_id}/${input.category}/${fileId}_${cleanFileName}`;

    const storageProvider = getStorageProvider();
    const presigned = await storageProvider.getUploadUrl({
      storagePath,
      mimeType: input.mime_type,
      maxSizeBytes: input.file_size_bytes,
    });

    const document = await documentsRepository.insertDocument({
      caregiverId: input.caregiver_id,
      orgId,
      category: input.category,
      storagePath,
      fileName: input.file_name,
      fileSizeBytes: input.file_size_bytes,
      mimeType: input.mime_type,
      expirationDate: input.expiration_date,
      hasNoExpiration: !input.expiration_date,
    });

    // Record UPLOAD audit log
    await documentsRepository.insertDocAuditLog(
      document.id,
      user.id,
      'UPLOAD',
      ipAddress,
      { category: input.category, fileName: input.file_name, storagePath }
    );

    return {
      uploadUrl: presigned.uploadUrl,
      document,
    };
  }

  /**
   * Generates a time-limited secure download URL and audits the PHI access
   */
  async getDownloadUrl(
    documentId: string,
    user: AuthenticatedUser,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ downloadUrl: string; document: CaregiverDocument }> {
    const document = await documentsRepository.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Role boundary checks:
    // If not super_admin, verify org_id matches
    if (user.role !== 'super_admin' && user.org_id && user.org_id !== document.org_id) {
      throw new Error('Forbidden: Document belongs to an out-of-state organization');
    }

    const storageProvider = getStorageProvider();
    const presigned = await storageProvider.getDownloadUrl({
      storagePath: document.storage_path,
    });

    // Immutable HIPAA Audit Entry
    await documentsRepository.insertDocAuditLog(
      document.id,
      user.id,
      'DOWNLOAD',
      ipAddress,
      { category: document.category, fileName: document.file_name }
    );

    await auditService.logAuditEvent({
      userId: user.id,
      orgId: document.org_id,
      eventType: 'DOCUMENT_DOWNLOAD',
      resourceType: 'caregiver_documents',
      resourceId: document.id,
      ipAddress,
      userAgent,
      metadata: {
        category: document.category,
        fileName: document.file_name,
      },
    });

    return {
      downloadUrl: presigned.downloadUrl,
      document,
    };
  }

  /**
   * Review document (approve or reject with clinical/compliance reason)
   */
  async reviewDocument(
    documentId: string,
    input: ReviewDocumentInput,
    reviewer: AuthenticatedUser,
    ipAddress?: string
  ): Promise<CaregiverDocument> {
    const document = await documentsRepository.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Agency admin check
    if (reviewer.role !== 'super_admin' && reviewer.org_id !== document.org_id) {
      throw new Error('Forbidden: Cannot review documents from another organization');
    }

    const updated = await documentsRepository.updateReviewStatus({
      documentId,
      verificationStatus: input.verification_status,
      rejectionReason: input.rejection_reason,
      reviewerId: reviewer.id,
    });

    if (!updated) {
      throw new Error('Failed to update document verification status');
    }

    const action = input.verification_status === 'approved' ? 'APPROVE' : 'REJECT';
    await documentsRepository.insertDocAuditLog(
      document.id,
      reviewer.id,
      action,
      ipAddress,
      { rejectionReason: input.rejection_reason }
    );

    await auditService.logAuditEvent({
      userId: reviewer.id,
      orgId: document.org_id,
      eventType: 'RECORD_MUTATION',
      resourceType: 'caregiver_documents',
      resourceId: document.id,
      ipAddress,
      metadata: {
        action,
        newStatus: input.verification_status,
        rejectionReason: input.rejection_reason,
      },
    });

    return updated;
  }

  /**
   * List all documents uploaded for a specific caregiver
   */
  async getCaregiverDocuments(caregiverId: string): Promise<CaregiverDocument[]> {
    return documentsRepository.findByCaregiver(caregiverId);
  }

  /**
   * Evaluates mandatory credential categories and calculates compliance percentage
   */
  async getComplianceScore(caregiverId: string): Promise<ComplianceScore> {
    const docs = await documentsRepository.findByCaregiver(caregiverId);

    let totalApproved = 0;
    let totalPending = 0;
    let totalRejected = 0;
    let totalExpired = 0;

    // Build latest map by category
    const categoryStatusMap: Record<string, string> = {};
    for (const doc of docs) {
      if (!categoryStatusMap[doc.category]) {
        categoryStatusMap[doc.category] = doc.verification_status;
      }
    }

    for (const cat of this.mandatoryCategories) {
      const status = categoryStatusMap[cat];
      if (status === 'approved') totalApproved++;
      else if (status === 'under_review' || status === 'pending_upload') totalPending++;
      else if (status === 'rejected') totalRejected++;
      else if (status === 'expired') totalExpired++;
    }

    const totalRequired = this.mandatoryCategories.length;
    const compliancePercentage = Math.round((totalApproved / totalRequired) * 100);

    return {
      total_required: totalRequired,
      total_approved: totalApproved,
      total_pending: totalPending,
      total_rejected: totalRejected,
      total_expired: totalExpired,
      compliance_percentage: compliancePercentage,
      is_compliant: totalApproved === totalRequired,
    };
  }

  /**
   * Scans for expired or expiring documents and queues automated notifications
   */
  async runCredentialExpirationCheck(): Promise<{ expiredCount: number; expiringSoonCount: number }> {
    const expiringDocs = await documentsRepository.findExpiringDocuments();
    let expiredCount = 0;
    let expiringSoonCount = 0;
    const now = new Date();

    for (const doc of expiringDocs) {
      if (!doc.expiration_date) continue;
      const expDate = new Date(doc.expiration_date);

      if (expDate < now) {
        if (doc.verification_status !== 'expired') {
          await documentsRepository.markExpired(doc.id);
          expiredCount++;

          const caregiverEmail = doc.personal_info?.email;
          if (caregiverEmail && doc.org_id) {
            await notificationsService.queueNotification({
              org_id: doc.org_id,
              channel: 'email',
              destination: caregiverEmail,
              subject: 'Credential Expiration Alert',
              recipient_user_id: doc.user_id,
              payload: {
                category: doc.category,
                expiration_date: doc.expiration_date,
                message: `Your credential [${doc.category}] expired on ${doc.expiration_date}. Please upload renewal document.`,
              },
            }).catch(() => {});
          }
        }
      } else {
        expiringSoonCount++;
      }
    }

    return { expiredCount, expiringSoonCount };
  }
}

export const documentsService = new DocumentsService();
