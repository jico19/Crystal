import type { DocumentCategory, VerificationStatus, CaregiverDocument } from '@crystal/types';

export type { DocumentCategory, VerificationStatus, CaregiverDocument };

export interface CreateDocumentRecordParams {
  id?: string;
  caregiverId: string;
  orgId: string;
  category: DocumentCategory;
  storagePath: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  issueDate?: string;
  expirationDate?: string;
  hasNoExpiration?: boolean;
}

export interface DocumentReviewParams {
  documentId: string;
  verificationStatus: 'approved' | 'rejected';
  rejectionReason?: string;
  reviewerId: string;
}
