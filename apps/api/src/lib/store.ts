import type { CaregiverProfile, OnboardingChecklist, PublicInquiry } from '@crystal/types';

// In-memory persistent store for local development simulation
export const mockInquiries: PublicInquiry[] = [
  {
    id: 'inq-001',
    org_id: '00000000-0000-0000-0000-000000000001',
    state_code: 'GA',
    full_name: 'Eleanor Vance',
    email: 'eleanor.vance@example.com',
    phone: '(404) 555-8833',
    inquiry_type: 'client_care_inquiry',
    message: 'Looking for 20 hours/week personal attendant care for my mother in Buckhead, Atlanta.',
    source_url: 'https://withopenhands.com/contact',
    status: 'new',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'inq-002',
    org_id: '00000000-0000-0000-0000-000000000002',
    state_code: 'IN',
    full_name: 'Marcus Brody',
    email: 'm.brody@example.com',
    phone: '(317) 555-4921',
    inquiry_type: 'caregiver_inquiry',
    message: 'Certified CNA with 5 years in-home care experience applying for weekend attendant shifts in Indianapolis.',
    source_url: 'https://cherishopenarms.com/contact',
    status: 'contacted',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'inq-003',
    org_id: '00000000-0000-0000-0000-000000000001',
    state_code: 'GA',
    full_name: 'David Sterling',
    email: 'david.s@example.com',
    phone: '(770) 555-2244',
    inquiry_type: 'general_question',
    message: 'Do you accept Georgia Medicaid CCSP waiver for specialized respite care?',
    source_url: 'https://withopenhands.com/services',
    status: 'new',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

// ─── Caregiver Profile Store ──────────────────────────────────────────────────

/** Default onboarding checklist for new applicants */
const DEFAULT_ONBOARDING_CHECKLIST: OnboardingChecklist = {
  application_form: 'in_progress',
  id_documents: 'not_started',
  background_check: 'not_started',
  tb_physical: 'not_started',
  in_service_orientation: 'not_started',
  direct_deposit_w4: 'not_started',
  final_admin_approval: 'not_started',
};

/** In-memory caregiver profile store for local dev */
export const mockCaregiverProfiles: Map<string, CaregiverProfile> = new Map();

/**
 * Gets or initializes a caregiver profile for a given user.
 * In production this would query caregiver_profiles via Supabase.
 */
export function getOrCreateCaregiverProfile(
  userId: string,
  orgId: string,
  stateCode: 'GA' | 'IN' | 'FL'
): CaregiverProfile {
  const existing = mockCaregiverProfiles.get(userId);
  if (existing) return existing;

  const profile: CaregiverProfile = {
    id: `profile-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    user_id: userId,
    org_id: orgId,
    state_code: stateCode,
    application_status: 'draft',
    application_step: 1,
    personal_info: {} as CaregiverProfile['personal_info'],
    positions_applied: [],
    availability: {} as CaregiverProfile['availability'],
    experience_history: [],
    professional_licenses: [],
    references: [],
    legal_disclosures: {},
    onboarding_checklist: { ...DEFAULT_ONBOARDING_CHECKLIST },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockCaregiverProfiles.set(userId, profile);
  return profile;
}

/**
 * Updates a caregiver profile in the store.
 */
export function updateCaregiverProfile(
  userId: string,
  updates: Partial<CaregiverProfile>
): CaregiverProfile | null {
  const profile = mockCaregiverProfiles.get(userId);
  if (!profile) return null;
  const updated: CaregiverProfile = { ...profile, ...updates, updated_at: new Date().toISOString() };
  mockCaregiverProfiles.set(userId, updated);
  return updated;
}

// ─── E-Signature Envelope Store (Feature Spec 09) ───────────────────────────

import type { SignatureEnvelope, SignerRole } from '@crystal/types';
import { computeDocumentHash } from './security';

/** In-memory signature envelopes store for local dev & testing */
export const mockSignatureEnvelopes: Map<string, SignatureEnvelope> = new Map();

/**
 * Creates and stores a new e-signature envelope in draft/sent status.
 */
export function createSignatureEnvelope(params: {
  org_id: string;
  template_type: 'caregiver_onboarding_packet' | 'client_service_agreement';
  signer_name: string;
  signer_email: string;
  signer_user_id?: string;
  signer_role?: SignerRole;
  title?: string;
}): SignatureEnvelope {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days expiry
  const id = `env-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const role: SignerRole =
    params.signer_role ??
    (params.template_type === 'caregiver_onboarding_packet' ? 'caregiver' : 'client_rep');

  const defaultTitle =
    params.title ??
    (params.template_type === 'caregiver_onboarding_packet'
      ? 'Caregiver Onboarding & Attestation Packet'
      : 'Client Home Care Services Agreement');

  const envelope: SignatureEnvelope = {
    id,
    org_id: params.org_id,
    title: defaultTitle,
    template_type: params.template_type,
    status: 'sent',
    signer_role: role,
    signer_user_id: params.signer_user_id,
    signer_name: params.signer_name,
    signer_email: params.signer_email,
    expires_at: expiresAt,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  mockSignatureEnvelopes.set(id, envelope);
  return envelope;
}

/**
 * Retrieves a signature envelope by ID.
 */
export function getSignatureEnvelope(id: string): SignatureEnvelope | undefined {
  return mockSignatureEnvelopes.get(id);
}

/**
 * Completes and cryptographically stamps an e-signature envelope.
 */
export function completeSignatureEnvelope(
  id: string,
  signatureBase64: string,
  ipAddress?: string,
  userAgent?: string
): SignatureEnvelope | null {
  const envelope = mockSignatureEnvelopes.get(id);
  if (!envelope) return null;

  const signedAt = new Date().toISOString();

  const hash = computeDocumentHash({
    envelope_id: envelope.id,
    org_id: envelope.org_id,
    signer_name: envelope.signer_name,
    signer_email: envelope.signer_email,
    signed_at: signedAt,
    signature_base64: signatureBase64,
  });

  const completedEnvelope: SignatureEnvelope = {
    ...envelope,
    status: 'completed',
    signature_base64: signatureBase64,
    signed_document_hash: hash,
    ip_address: ipAddress || '127.0.0.1',
    user_agent: userAgent || 'Crystal-Esign-Client/1.0',
    signed_at: signedAt,
    updated_at: signedAt,
  };

  mockSignatureEnvelopes.set(id, completedEnvelope);
  return completedEnvelope;
}

// ─── Caregiver Documents & Compliance Store (Feature Spec 03) ────────────────

import type {
  CaregiverDocument,
  DocumentCategoryType,
  DocumentAuditLog,
  DocumentAuditActionType,
  ComplianceScore,
} from '@crystal/types';

export const mockCaregiverDocuments: Map<string, CaregiverDocument> = new Map();
export const mockDocumentAuditLogs: DocumentAuditLog[] = [];

export const MANDATORY_DOCUMENT_CATEGORIES: DocumentCategoryType[] = [
  'drivers_license',
  'social_security_card',
  'cpr_first_aid',
  'tb_test_screen',
  'physical_exam',
  'background_check_report',
];

/**
 * Computes expiration days remaining and expiring soon flags (< 30 days).
 */
export function enrichDocumentWithExpiration(doc: CaregiverDocument): CaregiverDocument {
  if (doc.has_no_expiration || !doc.expiration_date) {
    return { ...doc, days_until_expiration: undefined, is_expiring_soon: false };
  }

  const now = new Date();
  const exp = new Date(doc.expiration_date);
  const diffTime = exp.getTime() - now.getTime();
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = daysUntil < 0;
  const isExpiringSoon = daysUntil >= 0 && daysUntil <= 30;

  return {
    ...doc,
    days_until_expiration: daysUntil,
    is_expiring_soon: isExpiringSoon,
    verification_status: isExpired ? 'expired' : doc.verification_status,
  };
}

/**
 * Calculates overall compliance percentage and breakdown.
 */
export function calculateComplianceScore(
  caregiverId: string,
  documents: CaregiverDocument[]
): ComplianceScore {
  const enriched = documents.map(enrichDocumentWithExpiration);
  const approvedDocs = enriched.filter((d) => d.verification_status === 'approved');
  const underReviewDocs = enriched.filter((d) => d.verification_status === 'under_review');
  const rejectedDocs = enriched.filter((d) => d.verification_status === 'rejected');
  const expiredDocs = enriched.filter((d) => d.verification_status === 'expired');
  const expiringSoonDocs = enriched.filter((d) => d.is_expiring_soon && d.verification_status === 'approved');

  const approvedCategories = new Set(approvedDocs.map((d) => d.category));
  const missingCategories = MANDATORY_DOCUMENT_CATEGORIES.filter((cat) => !approvedCategories.has(cat));

  const totalRequired = MANDATORY_DOCUMENT_CATEGORIES.length;
  const scorePercentage = Math.round(
    Math.min(100, (approvedCategories.size / totalRequired) * 100)
  );

  return {
    caregiver_id: caregiverId,
    score_percentage: scorePercentage,
    total_required: totalRequired,
    approved_count: approvedDocs.length,
    under_review_count: underReviewDocs.length,
    rejected_count: rejectedDocs.length,
    expired_count: expiredDocs.length,
    missing_count: missingCategories.length,
    expiring_soon_count: expiringSoonDocs.length,
    missing_categories: missingCategories,
    expiring_documents: expiringSoonDocs,
  };
}

/**
 * Creates and logs an immutable document audit entry.
 */
export function createDocumentAuditLog(
  documentId: string,
  userId: string,
  action: DocumentAuditActionType,
  ipAddress?: string,
  userAgent?: string
): DocumentAuditLog {
  const log: DocumentAuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    document_id: documentId,
    user_id: userId,
    action,
    ip_address: ipAddress || '127.0.0.1',
    user_agent: userAgent || 'Crystal-Doc-Service/1.0',
    created_at: new Date().toISOString(),
  };
  mockDocumentAuditLogs.push(log);
  return log;
}


