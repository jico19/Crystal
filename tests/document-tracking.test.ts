import { describe, it, expect, beforeEach } from 'vitest';
import {
  DocumentUploadSchema,
  DocumentReviewSchema,
  DocumentCategorySchema,
} from '../packages/validation/src';
import { parseDocumentOCR } from '../apps/api/src/lib/ocr';
import {
  saveCaregiverDocumentDb,
  getCaregiverDocumentsDb,
  reviewCaregiverDocumentDb,
  getComplianceScoreDb,
  logDocumentAuditDb,
} from '../apps/api/src/lib/db';
import {
  calculateComplianceScore,
  enrichDocumentWithExpiration,
  mockCaregiverDocuments,
  mockDocumentAuditLogs,
} from '../apps/api/src/lib/store';
import type { CaregiverDocument } from '../packages/types/src';

describe('Feature Spec 03: Caregiver Documents & Credential Tracking', () => {
  beforeEach(() => {
    mockCaregiverDocuments.clear();
    mockDocumentAuditLogs.length = 0;
  });

  describe('1. Zod Validation Schemas', () => {
    it('validates a valid document upload payload', () => {
      const validPayload = {
        caregiver_id: 'caregiver-uuid-001',
        category: 'cpr_first_aid',
        file_name: 'aha_bls_cpr_cert.pdf',
        file_size_bytes: 1024 * 500, // 500 KB
        mime_type: 'application/pdf',
        issue_date: '2025-01-15',
        expiration_date: '2027-01-15',
        has_no_expiration: false,
      };

      const result = DocumentUploadSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects upload when file exceeds 25MB limit', () => {
      const oversizedPayload = {
        caregiver_id: 'caregiver-uuid-001',
        category: 'tb_test_screen',
        file_name: 'huge_scan.pdf',
        file_size_bytes: 26 * 1024 * 1024, // 26 MB
        mime_type: 'application/pdf',
      };

      const result = DocumentUploadSchema.safeParse(oversizedPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.file_size_bytes?.[0]).toContain('25MB');
      }
    });

    it('rejects unsupported mime types (e.g. exe, zip)', () => {
      const invalidMimePayload = {
        caregiver_id: 'caregiver-uuid-001',
        category: 'drivers_license',
        file_name: 'license.zip',
        file_size_bytes: 1024 * 100,
        mime_type: 'application/zip',
      };

      const result = DocumentUploadSchema.safeParse(invalidMimePayload);
      expect(result.success).toBe(false);
    });

    it('validates document review approval', () => {
      const reviewPayload = {
        document_id: 'doc-uuid-123',
        decision: 'approved',
      };

      const result = DocumentReviewSchema.safeParse(reviewPayload);
      expect(result.success).toBe(true);
    });

    it('requires a rejection reason when rejecting a document', () => {
      const invalidReject = {
        document_id: 'doc-uuid-123',
        decision: 'rejected',
        rejection_reason: 'no', // too short
      };

      const result = DocumentReviewSchema.safeParse(invalidReject);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.rejection_reason).toBeDefined();
      }
    });

    it('accepts valid rejection with detailed explanation', () => {
      const validReject = {
        document_id: 'doc-uuid-123',
        decision: 'rejected',
        rejection_reason: 'The CPR certificate photo is blurry and the expiration date is cut off.',
      };

      const result = DocumentReviewSchema.safeParse(validReject);
      expect(result.success).toBe(true);
    });
  });

  describe('2. Dual-Adapter OCR Engine (Agent-DocOCR)', () => {
    it('extracts CPR provider license and 2-year expiration', async () => {
      const ocr = await parseDocumentOCR({
        fileName: 'american_heart_association_cpr.pdf',
        category: 'cpr_first_aid',
      });

      expect(ocr.license_number).toMatch(/^CPR-AHA-\d{6}$/);
      expect(ocr.issuer).toContain('American');
      expect(ocr.confidence_score).toBeGreaterThanOrEqual(0.9);
      expect(ocr.expiration_date).toBeDefined();
    });

    it('extracts CNA license number for state registry', async () => {
      const ocrGA = await parseDocumentOCR({
        fileName: 'georgia_cna_cert.png',
        category: 'cna_hha_license',
      });

      expect(ocrGA.license_number).toMatch(/^GA-CNA-\d{6}$/);
      expect(ocrGA.issuer).toContain('Georgia Department of Community Health');
    });

    it('extracts Annual TB screening clearance date', async () => {
      const ocrTB = await parseDocumentOCR({
        fileName: 'tb_ppd_negative_screen.pdf',
        category: 'tb_test_screen',
      });

      expect(ocrTB.license_number).toMatch(/^TB-PPD-\d{5}$/);
      expect(ocrTB.expiration_date).toBeDefined();
    });

    it('handles evergreen documents with undefined expiration date', async () => {
      const ocrSSN = await parseDocumentOCR({
        fileName: 'social_security_card.jpg',
        category: 'social_security_card',
      });

      expect(ocrSSN.expiration_date).toBeUndefined();
      expect(ocrSSN.issuer).toBeDefined();
    });
  });

  describe('3. Database Layer & Expiration Calculations', () => {
    it('correctly calculates expiration status and expiring soon warnings', () => {
      const now = new Date();
      const in20Days = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const expired10DaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const docExpiringSoon: CaregiverDocument = {
        id: 'doc-001',
        caregiver_id: 'cg-1',
        org_id: '00000000-0000-0000-0000-000000000001',
        category: 'cpr_first_aid',
        file_storage_path: 'path/cpr.pdf',
        file_name: 'cpr.pdf',
        file_size_bytes: 1000,
        mime_type: 'application/pdf',
        expiration_date: in20Days,
        has_no_expiration: false,
        verification_status: 'approved',
        is_archived: false,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const enrichedSoon = enrichDocumentWithExpiration(docExpiringSoon);
      expect(enrichedSoon.is_expiring_soon).toBe(true);
      expect(enrichedSoon.days_until_expiration).toBeLessThanOrEqual(20);
      expect(enrichedSoon.verification_status).toBe('approved');

      const docExpired: CaregiverDocument = {
        ...docExpiringSoon,
        id: 'doc-002',
        expiration_date: expired10DaysAgo,
      };

      const enrichedExpired = enrichDocumentWithExpiration(docExpired);
      expect(enrichedExpired.verification_status).toBe('expired');
      expect(enrichedExpired.days_until_expiration).toBeLessThan(0);
    });

    it('calculates compliance score correctly across mandatory categories', () => {
      const caregiverId = 'cg-100';
      const now = new Date();
      const nextYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // 3 approved mandatory documents out of 6
      const docs: CaregiverDocument[] = [
        {
          id: 'd1',
          caregiver_id: caregiverId,
          org_id: 'org-1',
          category: 'drivers_license',
          file_storage_path: 'path',
          file_name: 'dl.pdf',
          file_size_bytes: 1000,
          mime_type: 'application/pdf',
          expiration_date: nextYear,
          has_no_expiration: false,
          verification_status: 'approved',
          is_archived: false,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
        {
          id: 'd2',
          caregiver_id: caregiverId,
          org_id: 'org-1',
          category: 'social_security_card',
          file_storage_path: 'path',
          file_name: 'ssn.pdf',
          file_size_bytes: 1000,
          mime_type: 'application/pdf',
          has_no_expiration: true,
          verification_status: 'approved',
          is_archived: false,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
        {
          id: 'd3',
          caregiver_id: caregiverId,
          org_id: 'org-1',
          category: 'cpr_first_aid',
          file_storage_path: 'path',
          file_name: 'cpr.pdf',
          file_size_bytes: 1000,
          mime_type: 'application/pdf',
          expiration_date: nextYear,
          has_no_expiration: false,
          verification_status: 'approved',
          is_archived: false,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
      ];

      const score = calculateComplianceScore(caregiverId, docs);
      // 3 of 6 mandatory categories = 50%
      expect(score.score_percentage).toBe(50);
      expect(score.approved_count).toBe(3);
      expect(score.missing_count).toBe(3);
      expect(score.missing_categories).toContain('tb_test_screen');
      expect(score.missing_categories).toContain('physical_exam');
      expect(score.missing_categories).toContain('background_check_report');
    });

    it('saves document and logs audit trail entry', async () => {
      const caregiverId = 'cg-audit-test';
      const doc = await saveCaregiverDocumentDb({
        caregiver_id: caregiverId,
        org_id: '00000000-0000-0000-0000-000000000001',
        category: 'tb_test_screen',
        file_storage_path: 'storage/tb.pdf',
        file_name: 'tb_screen.pdf',
        file_size_bytes: 2048,
        mime_type: 'application/pdf',
        expiration_date: '2026-10-01',
      });

      expect(doc.id).toBeDefined();
      expect(doc.category).toBe('tb_test_screen');

      // Log UPLOAD audit action
      const uploadAudit = await logDocumentAuditDb({
        document_id: doc.id,
        user_id: caregiverId,
        action: 'UPLOAD',
      });
      expect(uploadAudit.action).toBe('UPLOAD');

      // Review and approve document
      const reviewed = await reviewCaregiverDocumentDb({
        document_id: doc.id,
        decision: 'approved',
        verified_by: 'coordinator-sarah',
      });
      expect(reviewed?.verification_status).toBe('approved');
      expect(reviewed?.verified_by).toBe('coordinator-sarah');

      // Log APPROVE audit action
      const approveAudit = await logDocumentAuditDb({
        document_id: doc.id,
        user_id: 'coordinator-sarah',
        action: 'APPROVE',
      });
      expect(approveAudit.action).toBe('APPROVE');
      expect(mockDocumentAuditLogs.length).toBeGreaterThanOrEqual(2);
    });
  });
});
