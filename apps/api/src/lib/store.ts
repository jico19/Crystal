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
export const mockCaregiverProfiles: Map<string, CaregiverProfile> = new Map([
  [
    'cg-ga-001',
    {
      id: 'profile-001',
      user_id: 'cg-ga-001',
      org_id: '00000000-0000-0000-0000-000000000001',
      state_code: 'GA',
      application_status: 'approved',
      application_step: 5,
      personal_info: {
        first_name: 'Sarah',
        last_name: 'Jenkins',
        email: 'sarah.j@example.com',
        phone: '(404) 555-0144',
      } as any,
      positions_applied: ['pca'],
      availability: {} as any,
      experience_history: [],
      professional_licenses: [],
      references: [],
      legal_disclosures: {},
      onboarding_checklist: { ...DEFAULT_ONBOARDING_CHECKLIST },
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ],
  [
    'cg-ga-002',
    {
      id: 'profile-002',
      user_id: 'cg-ga-002',
      org_id: '00000000-0000-0000-0000-000000000001',
      state_code: 'GA',
      application_status: 'submitted',
      application_step: 5,
      personal_info: {
        first_name: 'Marcus',
        last_name: 'Cole',
        email: 'marcus.cole@example.com',
        phone: '(404) 555-0188',
      } as any,
      positions_applied: ['pca', 'companion'],
      availability: {} as any,
      experience_history: [],
      professional_licenses: [],
      references: [],
      legal_disclosures: {},
      onboarding_checklist: { ...DEFAULT_ONBOARDING_CHECKLIST },
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  [
    'cg-in-001',
    {
      id: 'profile-003',
      user_id: 'cg-in-001',
      org_id: '00000000-0000-0000-0000-000000000002',
      state_code: 'IN',
      application_status: 'approved',
      application_step: 5,
      personal_info: {
        first_name: 'David',
        last_name: 'Miller',
        email: 'david.miller@example.com',
        phone: '(317) 555-0122',
      } as any,
      positions_applied: ['cna'],
      availability: {} as any,
      experience_history: [],
      professional_licenses: [],
      references: [],
      legal_disclosures: {},
      onboarding_checklist: { ...DEFAULT_ONBOARDING_CHECKLIST },
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ],
]);


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
import { computeDocumentHash, computeCertificateHash } from './security';

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

export const mockCaregiverDocuments: Map<string, CaregiverDocument> = new Map([
  [
    'doc-001',
    {
      id: 'doc-001',
      caregiver_id: 'cg-ga-001',
      org_id: '00000000-0000-0000-0000-000000000001',
      category: 'cpr_first_aid',
      file_name: 'cpr_certification.pdf',
      file_storage_path: 'caregivers/cg-ga-001/cpr_certification.pdf',
      file_size_bytes: 102400,
      mime_type: 'application/pdf',
      verification_status: 'approved',
      expiration_date: '2027-06-15',
      has_no_expiration: false,
      is_archived: false,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],
  [
    'doc-002',
    {
      id: 'doc-002',
      caregiver_id: 'cg-ga-001',
      org_id: '00000000-0000-0000-0000-000000000001',
      category: 'tb_test_screen',
      file_name: 'tb_screening_report.pdf',
      file_storage_path: 'caregivers/cg-ga-001/tb_screening_report.pdf',
      file_size_bytes: 98000,
      mime_type: 'application/pdf',
      verification_status: 'approved',
      expiration_date: '2027-04-10',
      has_no_expiration: false,
      is_archived: false,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],
  [
    'doc-003',
    {
      id: 'doc-003',
      caregiver_id: 'cg-ga-002',
      org_id: '00000000-0000-0000-0000-000000000001',
      category: 'drivers_license',
      file_name: 'ga_drivers_license.png',
      file_storage_path: 'caregivers/cg-ga-002/ga_drivers_license.png',
      file_size_bytes: 204800,
      mime_type: 'image/png',
      verification_status: 'under_review',
      expiration_date: '2028-11-20',
      has_no_expiration: false,
      is_archived: false,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  [
    'doc-004',
    {
      id: 'doc-004',
      caregiver_id: 'cg-in-001',
      org_id: '00000000-0000-0000-0000-000000000002',
      category: 'cpr_first_aid',
      file_name: 'in_cpr_cert.pdf',
      file_storage_path: 'caregivers/cg-in-001/in_cpr_cert.pdf',
      file_size_bytes: 110000,
      mime_type: 'application/pdf',
      verification_status: 'under_review',
      expiration_date: '2027-08-01',
      has_no_expiration: false,
      is_archived: false,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
]);
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

// ─── In-Service Training & Continuing Education Store (Feature Spec 04) ──────

import type {
  TrainingModule,
  CaregiverTrainingProgress,
  QuizResultResponse,
  TrainingComplianceSummary,
  ClientProfile,
  ClientDocument,
  ClientIntakeInput,
} from '@crystal/types';

export const mockTrainingModules: TrainingModule[] = [
  {
    id: 'mod-001',
    state_code: 'ALL',
    title: 'HIPAA Compliance & Client Privacy in Home Care',
    description: 'Mandatory annual training covering Protected Health Information (PHI), minimum necessary disclosures, digital device security, and breach reporting protocols.',
    category: 'hipaa',
    video_url: 'https://stream.crystalhomecare.com/lessons/hipaa-101.m3u8',
    video_duration_seconds: 900,
    required_hours: 1.5,
    passing_score_percentage: 80,
    is_mandatory: true,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    quiz_questions: [
      {
        id: 'q1',
        question: 'Under HIPAA, which of the following is considered Protected Health Information (PHI)?',
        options: [
          'Client name, medical conditions, and residential address',
          'The agency\'s public website address',
          'The caregiver\'s personal lunch schedule',
          'General state labor laws',
        ],
        correct_index: 0,
      },
      {
        id: 'q2',
        question: 'When discussing a client\'s care needs with family members, what must be verified first?',
        options: [
          'Whether the family member paid for the service directly',
          'Client consent or valid Power of Attorney (POA) on file',
          'Caregiver\'s personal relationship with the family',
          'Only the client\'s age',
        ],
        correct_index: 1,
      },
      {
        id: 'q3',
        question: 'What is the appropriate protocol if you suspect a paper document containing client medical history was lost?',
        options: [
          'Wait 30 days to see if someone returns it',
          'Immediately notify the agency Compliance Officer or Administrator',
          'Create a duplicate and do not report it',
          'Post an announcement on social media',
        ],
        correct_index: 1,
      },
    ],
  },
  {
    id: 'mod-002',
    state_code: 'ALL',
    title: 'Infection Prevention & Bloodborne Pathogens',
    description: 'Standard precautions, proper PPE donning and doffing, hand hygiene, and sanitization protocols in private home care environments.',
    category: 'infection_control',
    video_url: 'https://stream.crystalhomecare.com/lessons/infection-control-102.m3u8',
    video_duration_seconds: 720,
    required_hours: 1.5,
    passing_score_percentage: 80,
    is_mandatory: true,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    quiz_questions: [
      {
        id: 'q1',
        question: 'What is the single most effective action to prevent the transmission of infection in home care?',
        options: [
          'Wearing gloves at all times without washing hands',
          'Proper hand hygiene using soap and water for at least 20 seconds',
          'Opening windows in the client home',
          'Spraying air freshener',
        ],
        correct_index: 1,
      },
      {
        id: 'q2',
        question: 'When should personal protective equipment (PPE) like disposable gloves be removed?',
        options: [
          'Immediately after finishing a care task and before touching clean surfaces',
          'At the end of the shift only',
          'After driving to the next client',
          'Gloves can be washed and reused',
        ],
        correct_index: 0,
      },
    ],
  },
  {
    id: 'mod-003',
    state_code: 'ALL',
    title: 'Elder Abuse Prevention, Neglect & Mandatory Reporting',
    description: 'Identifying physical, emotional, and financial elder abuse, recognizing signs of caregiver neglect, and state mandatory reporting timelines in Georgia and Indiana.',
    category: 'elder_abuse',
    video_url: 'https://stream.crystalhomecare.com/lessons/elder-abuse-103.m3u8',
    video_duration_seconds: 600,
    required_hours: 1.0,
    passing_score_percentage: 80,
    is_mandatory: true,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    quiz_questions: [
      {
        id: 'q1',
        question: 'As a home care employee in GA/IN, if you observe unexplained bruises or sudden withdrawals from a vulnerable adult\'s account, what is your legal duty?',
        options: [
          'Investigate the family independently',
          'You are a mandatory reporter and must report suspected abuse immediately to Adult Protective Services (APS)',
          'Wait until the client formally complains',
          'Only discuss it if asked by a supervisor',
        ],
        correct_index: 1,
      },
    ],
  },
  {
    id: 'mod-004',
    state_code: 'GA',
    title: 'Georgia DCH Healthcare Facility Regulation & Client Rights',
    description: 'Georgia-specific Department of Community Health (DCH) Chapter 111-8-65 standards for Private Home Care Providers and client bill of rights.',
    category: 'client_rights',
    video_url: 'https://stream.crystalhomecare.com/lessons/ga-dch-rights.m3u8',
    video_duration_seconds: 600,
    required_hours: 1.0,
    passing_score_percentage: 80,
    is_mandatory: true,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    quiz_questions: [
      {
        id: 'q1',
        question: 'Under Georgia DCH rules, clients have the right to:',
        options: [
          'Be treated with dignity, participate in their care plan, and lodge grievances without retaliation',
          'Change caregiver pay rates directly',
          'Refuse to sign mandatory state consent forms',
          'Dictate overtime schedules for agency staff',
        ],
        correct_index: 0,
      },
    ],
  },
  {
    id: 'mod-005',
    state_code: 'IN',
    title: 'Indiana FSSA Standards & Attendant Care Guidelines',
    description: 'Indiana Family and Social Services Administration (FSSA) home and community-based services rules and documentation standards.',
    category: 'client_rights',
    video_url: 'https://stream.crystalhomecare.com/lessons/in-fssa-standards.m3u8',
    video_duration_seconds: 600,
    required_hours: 1.0,
    passing_score_percentage: 80,
    is_mandatory: true,
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    quiz_questions: [
      {
        id: 'q1',
        question: 'Under Indiana Medicaid waiver rules, service times and tasks must match:',
        options: [
          'The authorized Individualized Service Plan (ISP) agreed with the Case Manager',
          'Whatever hours the client requests verbally on that day',
          'Caregiver personal preference',
          'Standard 40-hour weekly templates regardless of assessment',
        ],
        correct_index: 0,
      },
    ],
  },
];

export const mockCaregiverTrainingProgress = new Map<string, CaregiverTrainingProgress>();

export function getTrainingProgressKey(caregiverId: string, moduleId: string): string {
  return `${caregiverId}::${moduleId}`;
}

export function getTrainingModules(stateCode?: string): TrainingModule[] {
  return mockTrainingModules.filter((mod) => {
    if (!mod.is_active) return false;
    if (!stateCode || stateCode === 'ALL') return true;
    return mod.state_code === 'ALL' || mod.state_code === stateCode;
  });
}

export function getTrainingModuleById(id: string): TrainingModule | undefined {
  return mockTrainingModules.find((m) => m.id === id);
}

export function getCaregiverTrainingProgress(caregiverId: string): CaregiverTrainingProgress[] {
  return Array.from(mockCaregiverTrainingProgress.values()).filter(
    (p) => p.caregiver_id === caregiverId
  );
}

export function updateTrainingProgress(
  caregiverId: string,
  moduleId: string,
  watchSeconds: number,
  totalDurationSeconds: number
): CaregiverTrainingProgress {
  const key = getTrainingProgressKey(caregiverId, moduleId);
  const existing = mockCaregiverTrainingProgress.get(key);
  const now = new Date().toISOString();

  const progressPct = Math.min(100, Math.round((watchSeconds / Math.max(1, totalDurationSeconds)) * 100));
  const isCompleted = progressPct >= 90;

  const record: CaregiverTrainingProgress = {
    id: existing?.id || `prog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    caregiver_id: caregiverId,
    module_id: moduleId,
    watch_progress_percentage: Math.max(existing?.watch_progress_percentage || 0, progressPct),
    video_completed: existing?.video_completed || isCompleted,
    quiz_attempts: existing?.quiz_attempts || 0,
    quiz_score_percentage: existing?.quiz_score_percentage ?? null,
    passed: existing?.passed || false,
    certificate_url: existing?.certificate_url || null,
    certificate_hash: existing?.certificate_hash || null,
    completed_at: existing?.completed_at || null,
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  mockCaregiverTrainingProgress.set(key, record);
  return record;
}

export function submitTrainingQuiz(
  caregiverId: string,
  moduleId: string,
  answers: Array<{ question_id: string; selected_index: number }>
): QuizResultResponse {
  const mod = getTrainingModuleById(moduleId);
  if (!mod) {
    throw new Error(`Training module ${moduleId} not found`);
  }

  const key = getTrainingProgressKey(caregiverId, moduleId);
  const existing = mockCaregiverTrainingProgress.get(key);
  const attempts = (existing?.quiz_attempts || 0) + 1;

  let correctCount = 0;
  for (const q of mod.quiz_questions) {
    const ans = answers.find((a) => a.question_id === q.id);
    if (ans && ans.selected_index === q.correct_index) {
      correctCount++;
    }
  }

  const totalQuestions = mod.quiz_questions.length;
  const scorePercentage = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);
  const passed = scorePercentage >= mod.passing_score_percentage;
  const now = new Date().toISOString();

  let certHash: string | undefined;
  let certUrl: string | undefined;

  if (passed) {
    certHash = computeCertificateHash({
      caregiver_id: caregiverId,
      module_id: moduleId,
      score: scorePercentage,
      passed_at: now,
    });
    certUrl = `/api/v1/training/certificates/${certHash}`;
  }

  const updatedRecord: CaregiverTrainingProgress = {
    id: existing?.id || `prog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    caregiver_id: caregiverId,
    module_id: moduleId,
    watch_progress_percentage: Math.max(existing?.watch_progress_percentage || 0, 100),
    video_completed: true,
    quiz_attempts: attempts,
    quiz_score_percentage: scorePercentage,
    passed,
    certificate_url: certUrl || existing?.certificate_url || null,
    certificate_hash: certHash || existing?.certificate_hash || null,
    completed_at: passed ? (existing?.completed_at || now) : existing?.completed_at || null,
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  mockCaregiverTrainingProgress.set(key, updatedRecord);

  const profile = mockCaregiverProfiles.get(caregiverId);
  if (profile && passed) {
    const mandatoryMods = mockTrainingModules.filter(
      (m) => m.is_mandatory && (m.state_code === 'ALL' || m.state_code === profile.state_code)
    );
    const allProgress = getCaregiverTrainingProgress(caregiverId);
    const allMandatoryPassed = mandatoryMods.every((m) =>
      allProgress.some((p) => p.module_id === m.id && p.passed)
    );
    if (allMandatoryPassed) {
      profile.onboarding_checklist.in_service_orientation = 'verified';
    }
  }

  return {
    success: true,
    module_id: moduleId,
    score_percentage: scorePercentage,
    passing_score: mod.passing_score_percentage,
    passed,
    total_questions: totalQuestions,
    correct_count: correctCount,
    certificate_url: certUrl,
    certificate_hash: certHash,
    message: passed
      ? `Congratulations! You passed with ${scorePercentage}%. Certificate issued.`
      : `You scored ${scorePercentage}%. A minimum of ${mod.passing_score_percentage}% is required. Please review and try again.`,
  };
}

export function getTrainingComplianceSummary(caregiverId: string, stateCode: string = 'GA'): TrainingComplianceSummary {
  const mandatoryMods = mockTrainingModules.filter(
    (m) => m.is_mandatory && (m.state_code === 'ALL' || m.state_code === stateCode)
  );
  const progressList = getCaregiverTrainingProgress(caregiverId);
  const passedProgress = progressList.filter((p) => p.passed);

  const completedModuleIds = new Set(passedProgress.map((p) => p.module_id));
  const completedCount = mandatoryMods.filter((m) => completedModuleIds.has(m.id)).length;

  let earnedHours = 0;
  for (const p of passedProgress) {
    const mod = mockTrainingModules.find((m) => m.id === p.module_id);
    if (mod) {
      earnedHours += Number(mod.required_hours);
    }
  }

  const requiredAnnualHours = 12.0;
  const compliancePct = Math.min(100, Math.round((earnedHours / requiredAnnualHours) * 100));

  return {
    caregiver_id: caregiverId,
    completed_modules_count: completedCount,
    total_mandatory_modules: mandatoryMods.length,
    total_earned_hours: Number(earnedHours.toFixed(1)),
    required_annual_hours: requiredAnnualHours,
    compliance_percentage: compliancePct,
    is_compliant: completedCount >= mandatoryMods.length && earnedHours >= requiredAnnualHours,
  };
}

// ─── Client Intake & Document Management Store (Feature Spec 05) ──────────────

export const mockClients = new Map<string, ClientProfile>([
  [
    'cli-001',
    {
      id: 'cli-001',
      org_id: '00000000-0000-0000-0000-000000000001',
      state_code: 'GA',
      status: 'active',
      first_name: 'Arthur',
      last_name: 'Pendelton',
      dob: '1945-04-12',
      gender: 'Male',
      ssn_last4: '8831',
      medicaid_id: 'GA-MED-99281',
      primary_phone: '(404) 555-1945',
      service_address: {
        street: '1420 Piedmont Ave NE',
        apt: 'Apt 4B',
        city: 'Atlanta',
        state: 'GA',
        zip: '30309',
        gate_code: '#4419',
      },
      emergency_contacts: [
        {
          name: 'Sarah Pendelton Miller',
          relationship: 'Daughter',
          phone: '(404) 555-9012',
          is_primary: true,
          has_poa: true,
        },
      ],
      primary_physician: {
        name: 'Dr. Robert Chen, MD',
        practice: 'Emory Geriatric Care',
        phone: '(404) 555-7000',
        fax: '(404) 555-7001',
        npi: '1234567890',
      },
      care_needs: {
        adls: ['bathing', 'dressing', 'transferring'],
        iadls: ['meal_prep', 'medication_reminders', 'light_housekeeping'],
        allergies: ['Penicillin', 'Sulfa drugs'],
        diagnoses: ['Hypertension', 'Mild Cognitive Impairment (MCI)', 'Osteoarthritis'],
        mobility_notes: 'Uses walker for ambulation; standby assistance required for shower.',
      },
      primary_payer: 'medicaid_waiver',
      payer_details: {
        policy_number: 'CCSP-8831-GA',
        case_manager_name: 'Brenda Washington, LCSW',
        case_manager_phone: '(404) 555-3399',
      },
      created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ],
  [
    'cli-002',
    {
      id: 'cli-002',
      org_id: '00000000-0000-0000-0000-000000000002',
      state_code: 'IN',
      status: 'intake_pending',
      first_name: 'Evelyn',
      last_name: 'Harper',
      dob: '1952-11-03',
      gender: 'Female',
      ssn_last4: '4192',
      medicaid_id: 'IN-MED-77182',
      primary_phone: '(317) 555-6671',
      service_address: {
        street: '884 Meridian St',
        city: 'Indianapolis',
        state: 'IN',
        zip: '46204',
      },
      emergency_contacts: [
        {
          name: 'James Harper',
          relationship: 'Son',
          phone: '(317) 555-8820',
          is_primary: true,
          has_poa: false,
        },
      ],
      primary_physician: {
        name: 'Dr. Laura Miller',
        practice: 'IU Health Physicians',
        phone: '(317) 555-4000',
      },
      care_needs: {
        adls: ['bathing', 'continence'],
        iadls: ['meal_prep', 'shopping'],
        allergies: ['Latex'],
        diagnoses: ['Type 2 Diabetes', 'Diabetic Neuropathy'],
      },
      primary_payer: 'private_pay',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ],
]);

export const mockClientDocuments: ClientDocument[] = [
  {
    id: 'cdoc-001',
    client_id: 'cli-001',
    org_id: '00000000-0000-0000-0000-000000000001',
    doc_type: 'physician_orders_485',
    file_storage_path: 'clients/cli-001/physician_orders_485_2026.pdf',
    file_name: 'Emory_Physician_Order_485.pdf',
    file_size_bytes: 420500,
    mime_type: 'application/pdf',
    effective_date: '2026-08-01',
    expiration_date: '2026-10-30',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'cdoc-002',
    client_id: 'cli-001',
    org_id: '00000000-0000-0000-0000-000000000001',
    doc_type: 'service_agreement',
    file_storage_path: 'clients/cli-001/signed_service_agreement.pdf',
    file_name: 'Signed_Service_Agreement_WOH.pdf',
    file_size_bytes: 310200,
    mime_type: 'application/pdf',
    effective_date: '2026-08-01',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
];

export function createClientProfile(input: ClientIntakeInput): ClientProfile {
  const id = `cli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  const profile: ClientProfile = {
    ...input,
    id,
    status: 'intake_pending',
    created_at: now,
    updated_at: now,
  };

  mockClients.set(id, profile);
  return profile;
}

export function getClientProfile(id: string): ClientProfile | undefined {
  return mockClients.get(id);
}

export function listClients(orgId?: string, stateCode?: string): ClientProfile[] {
  return Array.from(mockClients.values()).filter((c) => {
    if (orgId && c.org_id !== orgId) return false;
    if (stateCode && c.state_code !== stateCode) return false;
    return true;
  });
}

export function uploadClientDocument(doc: Omit<ClientDocument, 'id' | 'created_at'>): ClientDocument {
  const newDoc: ClientDocument = {
    ...doc,
    id: `cdoc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    created_at: new Date().toISOString(),
  };
  mockClientDocuments.push(newDoc);
  return newDoc;
}

export function listClientDocuments(clientId: string): ClientDocument[] {
  return mockClientDocuments.filter((d) => d.client_id === clientId);
}

// ─── Client Prior Authorizations Store (Feature Spec 06) ─────────────────────

import type {
  ClientAuthorization,
  CreateAuthorizationInput,
  LogUtilizationInput,
  AuthorizationUtilizationSummary,
  AuthStatusType,
} from '@crystal/types';

export const mockClientAuthorizations: Map<string, ClientAuthorization> = new Map([
  [
    'auth-001',
    {
      id: 'auth-001',
      client_id: 'cli-001',
      org_id: '00000000-0000-0000-0000-000000000001',
      payer_name: 'Georgia Medicaid / CCSP Waiver',
      authorization_number: 'GA-AUTH-2026-0981',
      procedure_code: 'T1019',
      service_type: 'Personal Support Services',
      start_date: '2026-06-01',
      end_date: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0], // 45 days from now
      total_units_authorized: 400, // 100 hours
      total_units_used: 120, // 30 hours
      weekly_hours_cap: 25,
      status: 'expiring_soon',
      notes: 'Initial annual authorization approved by Georgia DCH for personal support.',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  [
    'auth-002',
    {
      id: 'auth-002',
      client_id: 'cli-002',
      org_id: '00000000-0000-0000-0000-000000000002',
      payer_name: 'Indiana FSSA / A&D Waiver',
      authorization_number: 'IN-PA-882190',
      procedure_code: 'S5125',
      service_type: 'Attendant Care',
      start_date: '2026-08-01',
      end_date: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0], // 120 days from now
      total_units_authorized: 640, // 160 hours
      total_units_used: 40, // 10 hours
      weekly_hours_cap: 20,
      status: 'active',
      notes: 'State-approved attendant care for daily living support.',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
]);

export function computeAuthorizationSummary(
  auth: ClientAuthorization
): AuthorizationUtilizationSummary {
  const remaining_units = Math.max(0, auth.total_units_authorized - auth.total_units_used);
  const total_hours_authorized = Number((auth.total_units_authorized / 4).toFixed(2));
  const total_hours_used = Number((auth.total_units_used / 4).toFixed(2));
  const remaining_hours = Number((remaining_units / 4).toFixed(2));
  const percent_utilized = Math.min(
    100,
    Number(((auth.total_units_used / auth.total_units_authorized) * 100).toFixed(1))
  );

  const now = new Date();
  const endDate = new Date(auth.end_date);
  const days_remaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const is_expiring_soon = days_remaining <= 60 && days_remaining > 0;
  const is_urgent = days_remaining <= 30 && days_remaining > 0;
  const is_exhausted = remaining_units <= 0;
  const is_overutilized = auth.total_units_used > auth.total_units_authorized;

  // Determine computed status
  let status: AuthStatusType = auth.status;
  if (days_remaining <= 0) {
    status = 'expired';
  } else if (is_exhausted) {
    status = 'exhausted';
  } else if (is_expiring_soon && status === 'active') {
    status = 'expiring_soon';
  }

  return {
    authorization_id: auth.id,
    total_units_authorized: auth.total_units_authorized,
    total_units_used: auth.total_units_used,
    remaining_units,
    total_hours_authorized,
    total_hours_used,
    remaining_hours,
    percent_utilized,
    days_remaining,
    is_expiring_soon,
    is_urgent,
    is_exhausted,
    is_overutilized,
    weekly_hours_cap: auth.weekly_hours_cap,
    status,
  };
}

export { computeAuthorizationSummary as storeComputeAuthSummary };


export function createClientAuthorization(
  input: CreateAuthorizationInput
): ClientAuthorization {
  const now = new Date().toISOString();
  const id = `auth-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const endDate = new Date(input.end_date);
  const days_remaining = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const status: AuthStatusType = days_remaining <= 60 ? 'expiring_soon' : 'active';

  const newAuth: ClientAuthorization = {
    id,
    client_id: input.client_id,
    org_id: input.org_id,
    payer_name: input.payer_name,
    authorization_number: input.authorization_number,
    procedure_code: input.procedure_code,
    service_type: input.service_type,
    start_date: input.start_date,
    end_date: input.end_date,
    total_units_authorized: input.total_units_authorized,
    total_units_used: 0,
    weekly_hours_cap: input.weekly_hours_cap,
    status,
    notes: input.notes,
    created_at: now,
    updated_at: now,
  };

  mockClientAuthorizations.set(id, newAuth);
  return newAuth;
}

export function getClientAuthorizations(
  clientId?: string,
  orgId?: string,
  status?: AuthStatusType
): ClientAuthorization[] {
  return Array.from(mockClientAuthorizations.values()).filter((auth) => {
    if (clientId && auth.client_id !== clientId) return false;
    if (orgId && auth.org_id !== orgId) return false;
    if (status && auth.status !== status) return false;
    return true;
  });
}

export function getClientAuthorizationById(
  id: string
): ClientAuthorization | undefined {
  return mockClientAuthorizations.get(id);
}

export function logAuthorizationUtilization(
  id: string,
  input: LogUtilizationInput
): { success: boolean; authorization?: ClientAuthorization; summary?: AuthorizationUtilizationSummary; error?: string } {
  const auth = mockClientAuthorizations.get(id);
  if (!auth) {
    return { success: false, error: `Authorization ${id} not found.` };
  }

  const newUnitsUsed = auth.total_units_used + input.units_to_log;
  auth.total_units_used = newUnitsUsed;
  auth.updated_at = new Date().toISOString();

  const summary = computeAuthorizationSummary(auth);
  auth.status = summary.status;

  mockClientAuthorizations.set(id, auth);

  return {
    success: true,
    authorization: auth,
    summary,
  };
}

export function getExpiringAuthorizations(
  orgId?: string,
  daysThreshold: number = 60
): Array<ClientAuthorization & { summary: AuthorizationUtilizationSummary }> {
  const now = Date.now();
  return Array.from(mockClientAuthorizations.values())
    .filter((auth) => {
      if (orgId && auth.org_id !== orgId) return false;
      const endMs = new Date(auth.end_date).getTime();
      const diffDays = Math.ceil((endMs - now) / (1000 * 60 * 60 * 24));
      return diffDays <= daysThreshold || auth.status === 'expiring_soon' || auth.status === 'exhausted';
    })
    .map((auth) => ({
      ...auth,
      summary: computeAuthorizationSummary(auth),
    }));
}

// ─── Feature Spec 07: Admin Command Center & State Reporting ────────────────

import type {
  AdminStateKpi,
  AdminDashboardMetrics,
  AdminWorkQueueItem,
  StateAuditReportRecord,
} from '@crystal/types';

const ADMIN_ORGS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    state_code: 'GA',
    name: 'With Open Hands',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    state_code: 'IN',
    name: 'Cherish Open Arms',
  },
];

export function getAdminStateKpis(stateCode?: string): AdminDashboardMetrics {
  const targetOrgs = ADMIN_ORGS.filter(
    (o) => !stateCode || stateCode === 'ALL' || o.state_code === stateCode
  );

  const kpis: AdminStateKpi[] = targetOrgs.map((org) => {
    // Caregiver profiles for this org
    const caregivers = Array.from(mockCaregiverProfiles.values()).filter(
      (cp) => cp.org_id === org.id || cp.state_code === org.state_code
    );
    const activeCaregivers = caregivers.filter((cp) => cp.application_status === 'approved').length;
    const pendingApplications = caregivers.filter((cp) => cp.application_status === 'submitted').length;

    // Documents pending review for this org
    const pendingDocuments = Array.from(mockCaregiverDocuments.values()).filter(
      (cd) => cd.org_id === org.id && cd.verification_status === 'under_review'
    ).length;

    // Active clients for this org
    const clients = Array.from(mockClients.values()).filter(
      (c) => c.org_id === org.id || c.state_code === org.state_code
    );
    const activeClients = clients.filter((c) => c.status === 'active' || c.status === 'intake_pending').length;

    // Authorizations for this org
    const auths = Array.from(mockClientAuthorizations.values()).filter((a) => a.org_id === org.id);
    const expiringAuths = auths.filter((a) => a.status === 'expiring_soon' || a.status === 'exhausted').length;
    const totalUnitsAuthorized = auths.reduce((acc, a) => acc + a.total_units_authorized, 0);
    const totalUnitsUsed = auths.reduce((acc, a) => acc + a.total_units_used, 0);
    const utilizationRate =
      totalUnitsAuthorized > 0
        ? Number(((totalUnitsUsed / totalUnitsAuthorized) * 100).toFixed(1))
        : 0;

    return {
      org_id: org.id,
      state_code: org.state_code,
      organization_name: org.name,
      active_caregivers_count: activeCaregivers,
      pending_applications_count: pendingApplications,
      pending_document_reviews_count: pendingDocuments,
      active_clients_count: activeClients,
      expiring_authorizations_count: expiringAuths,
      total_units_authorized: totalUnitsAuthorized,
      total_units_used: totalUnitsUsed,
      utilization_rate_pct: utilizationRate,
    };
  });

  const totals = kpis.reduce(
    (acc, k) => ({
      active_caregivers: acc.active_caregivers + k.active_caregivers_count,
      pending_applications: acc.pending_applications + k.pending_applications_count,
      pending_documents: acc.pending_documents + k.pending_document_reviews_count,
      active_clients: acc.active_clients + k.active_clients_count,
      expiring_authorizations: acc.expiring_authorizations + k.expiring_authorizations_count,
      total_units_auth: acc.total_units_auth + k.total_units_authorized,
      total_units_used: acc.total_units_used + k.total_units_used,
      overall_utilization_pct: 0,
    }),
    {
      active_caregivers: 0,
      pending_applications: 0,
      pending_documents: 0,
      active_clients: 0,
      expiring_authorizations: 0,
      total_units_auth: 0,
      total_units_used: 0,
      overall_utilization_pct: 0,
    }
  );

  totals.overall_utilization_pct =
    totals.total_units_auth > 0
      ? Number(((totals.total_units_used / totals.total_units_auth) * 100).toFixed(1))
      : 0;

  return {
    kpis,
    totals: {
      active_caregivers: totals.active_caregivers,
      pending_applications: totals.pending_applications,
      pending_documents: totals.pending_documents,
      active_clients: totals.active_clients,
      expiring_authorizations: totals.expiring_authorizations,
      overall_utilization_pct: totals.overall_utilization_pct,
    },
  };
}

export function getAdminWorkQueues(stateCode?: string): AdminWorkQueueItem[] {
  const items: AdminWorkQueueItem[] = [];

  // 1. Pending Documents Queue
  Array.from(mockCaregiverDocuments.values())
    .filter((cd) => {
      const docState = cd.org_id === '00000000-0000-0000-0000-000000000001' ? 'GA' : 'IN';
      return (
        (!stateCode || stateCode === 'ALL' || docState === stateCode) &&
        cd.verification_status === 'under_review'
      );
    })
    .forEach((cd) => {
      const docState = cd.org_id === '00000000-0000-0000-0000-000000000001' ? 'GA' : 'IN';
      items.push({
        id: cd.id,
        type: 'document_review',
        title: `Verify ${cd.category.toUpperCase().replace('_', ' ')}`,
        subtitle: `Caregiver ID: ${cd.caregiver_id} • File: ${cd.file_name}`,
        state_code: docState,
        org_id: cd.org_id,
        urgency: cd.expiration_date ? 'high' : 'medium',
        action_url: `/apply/documents`,
        created_at: cd.created_at,
      });
    });

  // 2. Pending Application Submissions
  Array.from(mockCaregiverProfiles.values())
    .filter(
      (cp) =>
        (!stateCode || stateCode === 'ALL' || cp.state_code === stateCode) &&
        cp.application_status === 'submitted'
    )
    .forEach((cp) => {
      const name = cp.personal_info
        ? `${cp.personal_info.first_name} ${cp.personal_info.last_name}`
        : 'Applicant';
      items.push({
        id: cp.id,
        type: 'application_review',
        title: `Review Onboarding Application: ${name}`,
        subtitle: `Positions: ${(cp.positions_applied || []).join(', ') || 'Attendant'} • State: ${cp.state_code}`,
        state_code: cp.state_code,
        org_id: cp.org_id,
        urgency: 'high',
        action_url: `/apply/status`,
        created_at: cp.created_at,
      });
    });

  // 3. Expiring Authorizations
  Array.from(mockClientAuthorizations.values())
    .filter((ca) => ca.status === 'expiring_soon' || ca.status === 'exhausted')
    .forEach((ca) => {
      const stateCodeForAuth = ca.org_id === '00000000-0000-0000-0000-000000000001' ? 'GA' : 'IN';
      if (stateCode && stateCode !== 'ALL' && stateCode !== stateCodeForAuth) return;

      const remainingUnits = Math.max(0, ca.total_units_authorized - ca.total_units_used);
      items.push({
        id: ca.id,
        type: 'expiring_authorization',
        title: `Renew Prior Auth: ${ca.authorization_number} (${ca.procedure_code})`,
        subtitle: `${ca.payer_name} • ${remainingUnits} units remaining • Ends: ${ca.end_date}`,
        state_code: stateCodeForAuth,
        org_id: ca.org_id,
        urgency: remainingUnits <= 20 ? 'high' : 'medium',
        action_url: `/authorizations`,
        created_at: ca.created_at,
      });
    });

  // Sort high urgency first
  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  return items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}

export function generateStateAuditReport(stateCode?: string): StateAuditReportRecord[] {
  const caregivers = Array.from(mockCaregiverProfiles.values()).filter(
    (cp) => !stateCode || stateCode === 'ALL' || cp.state_code === stateCode
  );

  return caregivers.map((cp) => {
    const docs = Array.from(mockCaregiverDocuments.values()).filter((d) => d.caregiver_id === cp.user_id);
    const score = calculateComplianceScore(cp.user_id, docs);

    const cpr = docs.find((d) => d.category === 'cpr_first_aid');
    const tb = docs.find((d) => d.category === 'tb_test_screen');
    const cna = docs.find((d) => (d.category as string) === 'cna_license');


    const progressList = Array.from(mockCaregiverTrainingProgress.values()).filter(
      (p) => p.caregiver_id === cp.user_id && p.passed
    );

    const fullName = cp.personal_info
      ? `${cp.personal_info.first_name} ${cp.personal_info.last_name}`
      : 'Caregiver';

    return {
      caregiver_id: cp.user_id,
      full_name: fullName,
      state_code: cp.state_code,
      application_status: cp.application_status,
      compliance_score_pct: score.score_percentage,
      cpr_status: cpr ? cpr.verification_status : 'missing',
      tb_screen_status: tb ? tb.verification_status : 'missing',
      cna_license_status: cna ? cna.verification_status : 'n/a',
      completed_training_modules_count: progressList.length,
      last_activity_date: cp.updated_at.split('T')[0],
    };
  });
}

export function convertAuditReportToCsv(records: StateAuditReportRecord[]): string {
  const headers = [
    'Caregiver ID',
    'Full Name',
    'State',
    'Application Status',
    'Compliance Score %',
    'CPR Certification',
    'TB Screening',
    'CNA License',
    'Completed In-Service Modules',
    'Last Activity Date',
  ];

  const rows = records.map((r) => [
    `"${r.caregiver_id}"`,
    `"${r.full_name.replace(/"/g, '""')}"`,
    `"${r.state_code}"`,
    `"${r.application_status}"`,
    `${r.compliance_score_pct}`,
    `"${r.cpr_status}"`,
    `"${r.tb_screen_status}"`,
    `"${r.cna_license_status}"`,
    `${r.completed_training_modules_count}`,
    `"${r.last_activity_date}"`,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
}





