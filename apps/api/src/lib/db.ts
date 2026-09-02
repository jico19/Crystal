import path from 'path';
import { PGlite } from '@electric-sql/pglite';
import type {
  CaregiverProfile,
  CaregiverPersonalInfo,
  CaregiverAvailability,
  CaregiverPositionType,
  WorkExperienceItem,
  ProfessionalLicenseItem,
  ReferenceItem,
  LegalDisclosures,
  OnboardingChecklist,
  PublicInquiry,
  InquiryType,
  InquiryStatus,
  SignatureEnvelope,
  SignerRole,
  StateCode,
  CaregiverDocument,
  DocumentCategoryType,
  DocVerificationStatusType,
  DocumentAuditLog,
  DocumentAuditActionType,
  ComplianceScore,
  OcrExtractedData,
  TrainingModule,
  CaregiverTrainingProgress,
  QuizResultResponse,
  TrainingComplianceSummary,
  ClientProfile,
  ClientDocument,
  ClientIntakeInput,
  ClientAuthorization,
  CreateAuthorizationInput,
  LogUtilizationInput,
  AuthorizationUtilizationSummary,
  AuthStatusType,
} from '@crystal/types';
import { computeDocumentHash, sanitizePersonalInfoSSN } from './security';
import {
  mockCaregiverProfiles,
  mockSignatureEnvelopes,
  mockInquiries,
  mockCaregiverDocuments,
  mockDocumentAuditLogs,
  mockTrainingModules,
  mockCaregiverTrainingProgress,
  mockClients,
  mockClientDocuments,
  mockClientAuthorizations,
  enrichDocumentWithExpiration,
  calculateComplianceScore,
  createDocumentAuditLog,
  getOrCreateCaregiverProfile as storeGetOrCreateProfile,
  updateCaregiverProfile as storeUpdateProfile,
  createSignatureEnvelope as storeCreateEnvelope,
  getSignatureEnvelope as storeGetEnvelope,
  completeSignatureEnvelope as storeCompleteEnvelope,
  getTrainingModules as storeGetTrainingModules,
  getTrainingModuleById as storeGetTrainingModuleById,
  getCaregiverTrainingProgress as storeGetCaregiverTrainingProgress,
  updateTrainingProgress as storeUpdateTrainingProgress,
  submitTrainingQuiz as storeSubmitTrainingQuiz,
  getTrainingComplianceSummary as storeGetTrainingComplianceSummary,
  createClientProfile as storeCreateClientProfile,
  getClientProfile as storeGetClientProfile,
  listClients as storeListClients,
  uploadClientDocument as storeUploadClientDocument,
  listClientDocuments as storeListClientDocuments,
  createClientAuthorization as storeCreateAuthorization,
  getClientAuthorizations as storeGetAuthorizations,
  getClientAuthorizationById as storeGetAuthorizationById,
  logAuthorizationUtilization as storeLogUtilization,
  computeAuthorizationSummary as storeComputeAuthSummary,
  getExpiringAuthorizations as storeGetExpiringAuthorizations,
} from './store';

// ─── Singleton Database Instance ─────────────────────────────────────────────

interface GlobalDbState {
  crystalDbInstance?: PGlite | null;
  crystalDbInitPromise?: Promise<PGlite> | null;
}

const globalForDb = globalThis as unknown as GlobalDbState;

/**
 * Returns the singleton PGlite database instance.
 * Defaults to persisting in `./.pglite-data` unless `PG_IN_MEMORY=true`.
 */
export function getDb(): PGlite {
  if (!globalForDb.crystalDbInstance) {
    if (process.env.PG_IN_MEMORY === 'true') {
      globalForDb.crystalDbInstance = new PGlite();
    } else {
      try {
        const dataDir = process.env.PGLITE_DATA_DIR ?? path.join(process.cwd(), '.pglite-data');
        globalForDb.crystalDbInstance = new PGlite(dataDir);
      } catch (err) {
        console.warn('[PGlite] Directory access fallback to memory:', err);
        globalForDb.crystalDbInstance = new PGlite();
      }
    }
  }
  return globalForDb.crystalDbInstance;
}

/**
 * Overrides or resets the database instance (useful for testing).
 */
export function setDb(instance: PGlite | null): void {
  globalForDb.crystalDbInstance = instance;
  globalForDb.crystalDbInitPromise = null;
}

/**
 * Closes the active PGlite instance and resets initialization state.
 */
export async function resetDb(): Promise<void> {
  if (globalForDb.crystalDbInstance) {
    try {
      await globalForDb.crystalDbInstance.close();
    } catch {
      /* silent */
    }
    globalForDb.crystalDbInstance = null;
  }
  globalForDb.crystalDbInitPromise = null;
}

// ─── Schema Initialization & Seeding ──────────────────────────────────────────

/**
 * Bootstraps the PostgreSQL schema and seeds default organization and inquiry data.
 */
export async function initDb(force = false): Promise<PGlite> {
  if (globalForDb.crystalDbInitPromise && !force) {
    return globalForDb.crystalDbInitPromise;
  }

  globalForDb.crystalDbInitPromise = (async () => {
    const db = getDb();
    try {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS organizations (
          id UUID PRIMARY KEY,
          name TEXT NOT NULL,
          state_code TEXT NOT NULL,
          domain TEXT NOT NULL,
          license_number TEXT NOT NULL,
          contact_phone TEXT NOT NULL,
          contact_email TEXT NOT NULL,
          emergency_phone TEXT,
          office_address JSONB NOT NULL DEFAULT '{}'::jsonb,
          office_hours TEXT NOT NULL DEFAULT '',
          branding_theme JSONB NOT NULL DEFAULT '{}'::jsonb,
          enabled_services JSONB NOT NULL DEFAULT '[]'::jsonb,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS public_inquiries (
          id TEXT PRIMARY KEY,
          org_id UUID REFERENCES organizations(id),
          state_code TEXT NOT NULL,
          full_name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          inquiry_type TEXT NOT NULL,
          message TEXT NOT NULL,
          source_url TEXT NOT NULL DEFAULT '',
          ip_address TEXT,
          status TEXT NOT NULL DEFAULT 'new',
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS caregiver_profiles (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL UNIQUE,
          org_id UUID REFERENCES organizations(id),
          state_code TEXT NOT NULL,
          application_status TEXT NOT NULL DEFAULT 'draft',
          application_step INTEGER NOT NULL DEFAULT 1,
          personal_info JSONB NOT NULL DEFAULT '{}'::jsonb,
          positions_applied JSONB NOT NULL DEFAULT '[]'::jsonb,
          availability JSONB NOT NULL DEFAULT '{}'::jsonb,
          experience_history JSONB NOT NULL DEFAULT '[]'::jsonb,
          professional_licenses JSONB NOT NULL DEFAULT '[]'::jsonb,
          "references" JSONB NOT NULL DEFAULT '[]'::jsonb,
          legal_disclosures JSONB NOT NULL DEFAULT '{}'::jsonb,
          onboarding_checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
          assigned_coordinator_id TEXT,
          rejection_reason TEXT,
          submitted_at TIMESTAMPTZ,
          approved_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS signature_envelopes (
          id TEXT PRIMARY KEY,
          org_id UUID REFERENCES organizations(id),
          title TEXT NOT NULL,
          template_type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'sent',
          signer_role TEXT NOT NULL DEFAULT 'caregiver',
          signer_user_id TEXT,
          signer_name TEXT NOT NULL,
          signer_email TEXT NOT NULL,
          signature_base64 TEXT,
          signed_document_hash TEXT,
          ip_address TEXT,
          user_agent TEXT,
          signed_at TIMESTAMPTZ,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS caregiver_documents (
          id TEXT PRIMARY KEY,
          caregiver_id TEXT NOT NULL,
          org_id UUID REFERENCES organizations(id),
          category TEXT NOT NULL,
          file_storage_path TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_size_bytes BIGINT NOT NULL,
          mime_type TEXT NOT NULL,
          issue_date DATE,
          expiration_date DATE,
          has_no_expiration BOOLEAN NOT NULL DEFAULT false,
          verification_status TEXT NOT NULL DEFAULT 'under_review',
          verified_by TEXT,
          verified_at TIMESTAMPTZ,
          rejection_reason TEXT,
          ocr_extracted_data JSONB DEFAULT '{}'::jsonb,
          is_archived BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS document_audit_logs (
          id TEXT PRIMARY KEY,
          document_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          action TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS training_modules (
          id TEXT PRIMARY KEY,
          org_id UUID REFERENCES organizations(id),
          state_code TEXT NOT NULL DEFAULT 'ALL',
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL,
          video_url TEXT NOT NULL,
          video_duration_seconds INTEGER NOT NULL,
          required_hours NUMERIC(4,2) NOT NULL DEFAULT 1.00,
          passing_score_percentage INTEGER NOT NULL DEFAULT 80,
          quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
          is_mandatory BOOLEAN NOT NULL DEFAULT true,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS caregiver_training_progress (
          id TEXT PRIMARY KEY,
          caregiver_id TEXT NOT NULL,
          module_id TEXT NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
          watch_progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
          video_completed BOOLEAN NOT NULL DEFAULT false,
          quiz_attempts INTEGER NOT NULL DEFAULT 0,
          quiz_score_percentage INTEGER,
          passed BOOLEAN NOT NULL DEFAULT false,
          certificate_url TEXT,
          certificate_hash TEXT,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(caregiver_id, module_id)
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_cg_tr_prog_unique ON caregiver_training_progress(caregiver_id, module_id);

        CREATE TABLE IF NOT EXISTS clients (
          id TEXT PRIMARY KEY,
          org_id UUID REFERENCES organizations(id),
          state_code TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'inquiry',
          first_name TEXT NOT NULL,
          middle_name TEXT,
          last_name TEXT NOT NULL,
          dob DATE NOT NULL,
          gender TEXT,
          ssn_last4 TEXT,
          medicaid_id TEXT,
          primary_phone TEXT NOT NULL,
          service_address JSONB NOT NULL,
          emergency_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
          primary_physician JSONB NOT NULL DEFAULT '{}'::jsonb,
          care_needs JSONB NOT NULL DEFAULT '{}'::jsonb,
          primary_payer TEXT NOT NULL DEFAULT 'private_pay',
          payer_details JSONB DEFAULT '{}'::jsonb,
          assigned_rn_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS client_documents (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          org_id UUID REFERENCES organizations(id),
          doc_type TEXT NOT NULL,
          file_storage_path TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_size_bytes BIGINT NOT NULL,
          mime_type TEXT NOT NULL,
          effective_date DATE,
          expiration_date DATE,
          uploaded_by TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS client_authorizations (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          org_id UUID REFERENCES organizations(id),
          payer_name VARCHAR(150) NOT NULL,
          authorization_number VARCHAR(100) NOT NULL,
          procedure_code VARCHAR(20) NOT NULL,
          service_type VARCHAR(100) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          total_units_authorized NUMERIC(10,2) NOT NULL,
          total_units_used NUMERIC(10,2) NOT NULL DEFAULT 0.00,
          weekly_hours_cap NUMERIC(5,2),
          status TEXT NOT NULL DEFAULT 'active',
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_auth_client ON client_authorizations(client_id);
        CREATE INDEX IF NOT EXISTS idx_auth_org ON client_authorizations(org_id);
        CREATE INDEX IF NOT EXISTS idx_auth_dates_status ON client_authorizations(end_date, status);

        -- Georgia Default Organization (With Open Hands)
        INSERT INTO organizations (
          id, name, state_code, domain, license_number, contact_phone, contact_email, emergency_phone,
          office_address, office_hours, branding_theme, enabled_services, is_active, created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000001',
          'With Open Hands',
          'GA',
          'withopenhands.com',
          'GA-HCPR-049281',
          '(404) 555-0199',
          'care@withopenhands.com',
          '(404) 555-0190',
          '{"street":"1000 Peachtree St NE, Suite 400","city":"Atlanta","state":"GA","zip":"30309"}'::jsonb,
          'Mon-Fri 8:30 AM - 5:00 PM EST (24/7 On-Call Support)',
          '{"primary_color":"#0f766e","secondary_color":"#134e4a","accent_color":"#d97706","logo_url":"/images/woh-logo.svg","favicon_url":"/favicon.ico","hero_headline":"Compassionate In-Home Care for Georgia Families","hero_subheading":"With Open Hands provides state-licensed personal care, companion support, and skilled care tailored to your loved one in Atlanta and surrounding Georgia counties."}'::jsonb,
          '[{"slug":"personal-care","title":"Personal Care Support","description":"Assistance with daily living activities, bathing, dressing, hygiene, and safe mobility.","icon_name":"Heart"},{"slug":"companion-care","title":"Companion & Social Care","description":"Meaningful social engagement, meal preparation, medication reminders, and light housekeeping.","icon_name":"Users"},{"slug":"respite-care","title":"Family Respite Care","description":"Providing dedicated relief and peace of mind for primary family caregivers.","icon_name":"Clock"},{"slug":"skilled-nursing","title":"Skilled Nursing Oversight","description":"RN-directed care plans, vital sign monitoring, and chronic condition management in Georgia.","icon_name":"Stethoscope"}]'::jsonb,
          true,
          NOW(),
          NOW()
        ) ON CONFLICT (id) DO NOTHING;

        -- Indiana Default Organization (Cherish Open Arms)
        INSERT INTO organizations (
          id, name, state_code, domain, license_number, contact_phone, contact_email, emergency_phone,
          office_address, office_hours, branding_theme, enabled_services, is_active, created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000002',
          'Cherish Open Arms',
          'IN',
          'cherishopenarms.com',
          'IN-FSSA-982104',
          '(317) 555-0144',
          'care@cherishopenarms.com',
          '(317) 555-0140',
          '{"street":"201 N Illinois St, 16th Floor","city":"Indianapolis","state":"IN","zip":"46204"}'::jsonb,
          'Mon-Fri 8:30 AM - 5:00 PM EST (24/7 On-Call Support)',
          '{"primary_color":"#1e3a8a","secondary_color":"#1e293b","accent_color":"#f43f5e","logo_url":"/images/coa-logo.svg","favicon_url":"/favicon.ico","hero_headline":"Trusted In-Home Care & Support Across Indiana","hero_subheading":"Cherish Open Arms is dedicated to providing high-quality personal care, companionship, and respite services for seniors and individuals with disabilities across Indianapolis and Indiana."}'::jsonb,
          '[{"slug":"personal-care","title":"Attendant & Personal Care","description":"Hands-on assistance with hygiene, bathing, dressing, meal planning, and mobility support.","icon_name":"Heart"},{"slug":"companion-care","title":"Companion Care Services","description":"Engaging socialization, errands, housekeeping, and safety supervision throughout Indiana.","icon_name":"Users"},{"slug":"respite-care","title":"Respite Care Support","description":"Short-term and scheduled respite care providing dedicated relief for family caregivers.","icon_name":"Clock"},{"slug":"structured-family-care","title":"Structured Family Caregiving","description":"Support and coaching for eligible family caregivers under Indiana Medicaid waiver programs.","icon_name":"Home"}]'::jsonb,
          true,
          NOW(),
          NOW()
        ) ON CONFLICT (id) DO NOTHING;

        -- Default Seed Public Inquiries
        INSERT INTO public_inquiries (
          id, org_id, state_code, full_name, email, phone, inquiry_type, message, source_url, status, created_at, updated_at
        ) VALUES
        (
          'inq-001',
          '00000000-0000-0000-0000-000000000001',
          'GA',
          'Eleanor Vance',
          'eleanor.vance@example.com',
          '(404) 555-8833',
          'client_care_inquiry',
          'Looking for 20 hours/week personal attendant care for my mother in Buckhead, Atlanta.',
          'https://withopenhands.com/contact',
          'new',
          NOW() - INTERVAL '2 hours',
          NOW() - INTERVAL '2 hours'
        ),
        (
          'inq-002',
          '00000000-0000-0000-0000-000000000002',
          'IN',
          'Marcus Brody',
          'm.brody@example.com',
          '(317) 555-4921',
          'caregiver_inquiry',
          'Certified CNA with 5 years in-home care experience applying for weekend attendant shifts in Indianapolis.',
          'https://cherishopenarms.com/contact',
          'contacted',
          NOW() - INTERVAL '5 hours',
          NOW() - INTERVAL '1 hours'
        ),
        (
          'inq-003',
          '00000000-0000-0000-0000-000000000001',
          'GA',
          'David Sterling',
          'david.s@example.com',
          '(770) 555-2244',
          'general_question',
          'Do you accept Georgia Medicaid CCSP waiver for specialized respite care?',
          'https://withopenhands.com/services',
          'new',
          NOW() - INTERVAL '12 hours',
          NOW() - INTERVAL '12 hours'
        ) ON CONFLICT (id) DO NOTHING;

        -- Seed Default Training Modules
        INSERT INTO training_modules (
          id, org_id, state_code, title, description, category, video_url,
          video_duration_seconds, required_hours, passing_score_percentage, quiz_questions, is_mandatory, is_active
        ) VALUES (
          'mod-001', NULL, 'ALL',
          'HIPAA Compliance & Client Privacy in Home Care',
          'Mandatory annual training covering Protected Health Information (PHI), minimum necessary disclosures, digital device security, and breach reporting protocols.',
          'hipaa',
          'https://stream.crystalhomecare.com/lessons/hipaa-101.m3u8',
          900, 1.50, 80,
          '[{"id":"q1","question":"Under HIPAA, which of the following is considered Protected Health Information (PHI)?","options":["Client name, medical conditions, and residential address","The agency''s public website address","The caregiver''s personal lunch schedule","General state labor laws"],"correct_index":0},{"id":"q2","question":"When discussing a client''s care needs with family members, what must be verified first?","options":["Whether the family member paid for the service directly","Client consent or valid Power of Attorney (POA) on file","Caregiver''s personal relationship with the family","Only the client''s age"],"correct_index":1},{"id":"q3","question":"What is the appropriate protocol if you suspect a paper document containing client medical history was lost?","options":["Wait 30 days to see if someone returns it","Immediately notify the agency Compliance Officer or Administrator","Create a duplicate and do not report it","Post an announcement on social media"],"correct_index":1}]'::jsonb,
          true, true
        ),
        (
          'mod-002', NULL, 'ALL',
          'Infection Prevention & Bloodborne Pathogens',
          'Standard precautions, proper PPE donning and doffing, hand hygiene, and sanitization protocols in private home care environments.',
          'infection_control',
          'https://stream.crystalhomecare.com/lessons/infection-control-102.m3u8',
          720, 1.50, 80,
          '[{"id":"q1","question":"What is the single most effective action to prevent the transmission of infection in home care?","options":["Wearing gloves at all times without washing hands","Proper hand hygiene using soap and water for at least 20 seconds","Opening windows in the client home","Spraying air freshener"],"correct_index":1},{"id":"q2","question":"When should personal protective equipment (PPE) like disposable gloves be removed?","options":["Immediately after finishing a care task and before touching clean surfaces","At the end of the shift only","After driving to the next client","Gloves can be washed and reused"],"correct_index":0}]'::jsonb,
          true, true
        ),
        (
          'mod-003', NULL, 'ALL',
          'Elder Abuse Prevention, Neglect & Mandatory Reporting',
          'Identifying physical, emotional, and financial elder abuse, recognizing signs of caregiver neglect, and state mandatory reporting timelines in Georgia and Indiana.',
          'elder_abuse',
          'https://stream.crystalhomecare.com/lessons/elder-abuse-103.m3u8',
          600, 1.00, 80,
          '[{"id":"q1","question":"As a home care employee in GA/IN, if you observe unexplained bruises or sudden withdrawals from a vulnerable adult''s account, what is your legal duty?","options":["Investigate the family independently","You are a mandatory reporter and must report suspected abuse immediately to Adult Protective Services (APS)","Wait until the client formally complains","Only discuss it if asked by a supervisor"],"correct_index":1}]'::jsonb,
          true, true
        ),
        (
          'mod-004', NULL, 'GA',
          'Georgia DCH Healthcare Facility Regulation & Client Rights',
          'Georgia-specific Department of Community Health (DCH) Chapter 111-8-65 standards for Private Home Care Providers and client bill of rights.',
          'client_rights',
          'https://stream.crystalhomecare.com/lessons/ga-dch-rights.m3u8',
          600, 1.00, 80,
          '[{"id":"q1","question":"Under Georgia DCH rules, clients have the right to:","options":["Be treated with dignity, participate in their care plan, and lodge grievances without retaliation","Change caregiver pay rates directly","Refuse to sign mandatory state consent forms","Dictate overtime schedules for agency staff"],"correct_index":0}]'::jsonb,
          true, true
        ),
        (
          'mod-005', NULL, 'IN',
          'Indiana FSSA Standards & Attendant Care Guidelines',
          'Indiana Family and Social Services Administration (FSSA) home and community-based services rules and documentation standards.',
          'client_rights',
          'https://stream.crystalhomecare.com/lessons/in-fssa-standards.m3u8',
          600, 1.00, 80,
          '[{"id":"q1","question":"Under Indiana Medicaid waiver rules, service times and tasks must match:","options":["The authorized Individualized Service Plan (ISP) agreed with the Case Manager","Whatever hours the client requests verbally on that day","Caregiver personal preference","Standard 40-hour weekly templates regardless of assessment"],"correct_index":0}]'::jsonb,
          true, true
        ) ON CONFLICT (id) DO NOTHING;

        -- Seed Default Clients
        INSERT INTO clients (
          id, org_id, state_code, status, first_name, last_name, dob, gender, ssn_last4,
          medicaid_id, primary_phone, service_address, emergency_contacts, primary_physician, care_needs, primary_payer, payer_details
        ) VALUES (
          'cli-001',
          '00000000-0000-0000-0000-000000000001',
          'GA',
          'active',
          'Arthur',
          'Pendelton',
          '1945-04-12',
          'Male',
          '8831',
          'GA-MED-99281',
          '(404) 555-1945',
          '{"street":"1420 Piedmont Ave NE","apt":"Apt 4B","city":"Atlanta","state":"GA","zip":"30309","gate_code":"#4419"}'::jsonb,
          '[{"name":"Sarah Pendelton Miller","relationship":"Daughter","phone":"(404) 555-9012","is_primary":true,"has_poa":true}]'::jsonb,
          '{"name":"Dr. Robert Chen, MD","practice":"Emory Geriatric Care","phone":"(404) 555-7000","fax":"(404) 555-7001","npi":"1234567890"}'::jsonb,
          '{"adls":["bathing","dressing","transferring"],"iadls":["meal_prep","medication_reminders","light_housekeeping"],"allergies":["Penicillin","Sulfa drugs"],"diagnoses":["Hypertension","Mild Cognitive Impairment (MCI)","Osteoarthritis"],"mobility_notes":"Uses walker for ambulation; standby assistance required for shower."}'::jsonb,
          'medicaid_waiver',
          '{"policy_number":"CCSP-8831-GA","case_manager_name":"Brenda Washington, LCSW","case_manager_phone":"(404) 555-3399"}'::jsonb
        ),
        (
          'cli-002',
          '00000000-0000-0000-0000-000000000002',
          'IN',
          'intake_pending',
          'Evelyn',
          'Harper',
          '1952-11-03',
          'Female',
          '4192',
          'IN-MED-77182',
          '(317) 555-6671',
          '{"street":"884 Meridian St","city":"Indianapolis","state":"IN","zip":"46204"}'::jsonb,
          '[{"name":"James Harper","relationship":"Son","phone":"(317) 555-8820","is_primary":true,"has_poa":false}]'::jsonb,
          '{"name":"Dr. Laura Miller","practice":"IU Health Physicians","phone":"(317) 555-4000"}'::jsonb,
          '{"adls":["bathing","continence"],"iadls":["meal_prep","shopping"],"allergies":["Latex"],"diagnoses":["Type 2 Diabetes","Diabetic Neuropathy"]}'::jsonb,
          'private_pay',
          '{}'::jsonb
        ) ON CONFLICT (id) DO NOTHING;

        INSERT INTO client_authorizations (
          id, client_id, org_id, payer_name, authorization_number, procedure_code,
          service_type, start_date, end_date, total_units_authorized, total_units_used,
          weekly_hours_cap, status, notes
        ) VALUES (
          'auth-001', 'cli-001', '00000000-0000-0000-0000-000000000001',
          'Georgia Medicaid / CCSP Waiver', 'GA-AUTH-2026-0981', 'T1019',
          'Personal Support Services', '2026-06-01', '2026-10-15', 400.00, 120.00,
          25.00, 'expiring_soon', 'Initial annual authorization approved by Georgia DCH for personal support.'
        ) ON CONFLICT (id) DO NOTHING;

        INSERT INTO client_authorizations (
          id, client_id, org_id, payer_name, authorization_number, procedure_code,
          service_type, start_date, end_date, total_units_authorized, total_units_used,
          weekly_hours_cap, status, notes
        ) VALUES (
          'auth-002', 'cli-002', '00000000-0000-0000-0000-000000000002',
          'Indiana FSSA / A&D Waiver', 'IN-PA-882190', 'S5125',
          'Attendant Care', '2026-08-01', '2026-12-31', 640.00, 40.00,
          20.00, 'active', 'State-approved attendant care for daily living support.'
        ) ON CONFLICT (id) DO NOTHING;
      `);
    } catch (err) {
      console.warn('[initDb] PGlite table init warning:', err);
    }
    return db;
  })();

  return globalForDb.crystalDbInitPromise;
}

// ─── Row Mappers & Serialization Helpers ─────────────────────────────────────

function parseJson<T>(val: unknown): T {
  if (val === null || val === undefined) return {} as T;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val) as T;
    } catch {
      return val as unknown as T;
    }
  }
  return val as T;
}

function toIsoString(val: unknown): string | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') return val;
  return new Date(val as string | number).toISOString();
}

function mapRowToCaregiverProfile(row: Record<string, unknown>): CaregiverProfile {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    org_id: String(row.org_id),
    state_code: row.state_code as StateCode,
    application_status: row.application_status as CaregiverProfile['application_status'],
    application_step: Number(row.application_step),
    personal_info: parseJson<CaregiverProfile['personal_info']>(row.personal_info) || ({} as CaregiverPersonalInfo),
    positions_applied: parseJson<CaregiverProfile['positions_applied']>(row.positions_applied) || [],
    availability: parseJson<CaregiverProfile['availability']>(row.availability) || ({} as CaregiverAvailability),
    experience_history: parseJson<CaregiverProfile['experience_history']>(row.experience_history) || [],
    professional_licenses: parseJson<CaregiverProfile['professional_licenses']>(row.professional_licenses) || [],
    references: parseJson<CaregiverProfile['references']>(row.references) || [],
    legal_disclosures: parseJson<CaregiverProfile['legal_disclosures']>(row.legal_disclosures) || {},
    onboarding_checklist: parseJson<CaregiverProfile['onboarding_checklist']>(row.onboarding_checklist) || ({} as OnboardingChecklist),
    assigned_coordinator_id: row.assigned_coordinator_id ? String(row.assigned_coordinator_id) : undefined,
    rejection_reason: row.rejection_reason ? String(row.rejection_reason) : undefined,
    submitted_at: toIsoString(row.submitted_at),
    approved_at: toIsoString(row.approved_at),
    created_at: toIsoString(row.created_at) ?? new Date().toISOString(),
    updated_at: toIsoString(row.updated_at) ?? new Date().toISOString(),
  };
}

function mapRowToSignatureEnvelope(row: Record<string, unknown>): SignatureEnvelope {
  return {
    id: String(row.id),
    org_id: String(row.org_id),
    title: String(row.title),
    template_type: row.template_type as SignatureEnvelope['template_type'],
    status: row.status as SignatureEnvelope['status'],
    signer_role: row.signer_role as SignerRole,
    signer_user_id: row.signer_user_id ? String(row.signer_user_id) : undefined,
    signer_name: String(row.signer_name),
    signer_email: String(row.signer_email),
    signature_base64: row.signature_base64 ? String(row.signature_base64) : undefined,
    signed_document_hash: row.signed_document_hash ? String(row.signed_document_hash) : undefined,
    ip_address: row.ip_address ? String(row.ip_address) : undefined,
    user_agent: row.user_agent ? String(row.user_agent) : undefined,
    signed_at: toIsoString(row.signed_at),
    expires_at: toIsoString(row.expires_at) ?? new Date().toISOString(),
    created_at: toIsoString(row.created_at) ?? new Date().toISOString(),
    updated_at: toIsoString(row.updated_at) ?? new Date().toISOString(),
  };
}

function mapRowToPublicInquiry(row: Record<string, unknown>): PublicInquiry {
  return {
    id: String(row.id),
    org_id: String(row.org_id),
    state_code: row.state_code as StateCode,
    full_name: String(row.full_name),
    email: String(row.email),
    phone: String(row.phone),
    inquiry_type: row.inquiry_type as InquiryType,
    message: String(row.message),
    source_url: String(row.source_url ?? ''),
    ip_address: row.ip_address ? String(row.ip_address) : undefined,
    status: row.status as InquiryStatus,
    notes: row.notes ? String(row.notes) : undefined,
    created_at: toIsoString(row.created_at) ?? new Date().toISOString(),
    updated_at: toIsoString(row.updated_at) ?? new Date().toISOString(),
  };
}

function mapRowToCaregiverDocument(row: Record<string, unknown>): CaregiverDocument {
  const doc: CaregiverDocument = {
    id: String(row.id),
    caregiver_id: String(row.caregiver_id),
    org_id: String(row.org_id),
    category: row.category as DocumentCategoryType,
    file_storage_path: String(row.file_storage_path),
    file_name: String(row.file_name),
    file_size_bytes: Number(row.file_size_bytes),
    mime_type: String(row.mime_type),
    issue_date: row.issue_date ? String(row.issue_date) : undefined,
    expiration_date: row.expiration_date ? String(row.expiration_date) : undefined,
    has_no_expiration: Boolean(row.has_no_expiration),
    verification_status: row.verification_status as DocVerificationStatusType,
    verified_by: row.verified_by ? String(row.verified_by) : undefined,
    verified_at: toIsoString(row.verified_at),
    rejection_reason: row.rejection_reason ? String(row.rejection_reason) : undefined,
    ocr_extracted_data: parseJson<OcrExtractedData>(row.ocr_extracted_data),
    is_archived: Boolean(row.is_archived),
    created_at: toIsoString(row.created_at) ?? new Date().toISOString(),
    updated_at: toIsoString(row.updated_at) ?? new Date().toISOString(),
  };
  return enrichDocumentWithExpiration(doc);
}

function mapRowToDocumentAuditLog(row: Record<string, unknown>): DocumentAuditLog {
  return {
    id: String(row.id),
    document_id: String(row.document_id),
    user_id: String(row.user_id),
    action: row.action as DocumentAuditActionType,
    ip_address: row.ip_address ? String(row.ip_address) : undefined,
    user_agent: row.user_agent ? String(row.user_agent) : undefined,
    created_at: toIsoString(row.created_at) ?? new Date().toISOString(),
  };
}

// ─── Caregiver Draft & Application Queries ───────────────────────────────────

/**
 * Saves a caregiver application draft for a given step in the PostgreSQL database.
 */
export async function saveCaregiverDraftDb(
  userId: string,
  orgId: string,
  stateCode: StateCode,
  step: number,
  payload: Record<string, unknown>
): Promise<CaregiverProfile> {
  const defaultChecklist: OnboardingChecklist = {
    application_form: 'in_progress',
    id_documents: 'not_started',
    background_check: 'not_started',
    tb_physical: 'not_started',
    in_service_orientation: 'not_started',
    direct_deposit_w4: 'not_started',
    final_admin_approval: 'not_started',
  };

  try {
    await initDb();
    const db = getDb();

    const existing = await getCaregiverProfileDb(userId);
    const now = new Date().toISOString();

    const id = existing?.id ?? `profile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const applicationStep = existing ? Math.max(existing.application_step, step) : step;
    const applicationStatus = existing?.application_status ?? 'draft';

    let personalInfo = existing?.personal_info ?? ({} as CaregiverPersonalInfo);
    let positionsApplied = existing?.positions_applied ?? [];
    let availability = existing?.availability ?? ({} as CaregiverAvailability);
    let experienceHistory = existing?.experience_history ?? [];
    let professionalLicenses = existing?.professional_licenses ?? [];
    let references = existing?.references ?? [];
    const legalDisclosures = existing?.legal_disclosures ?? {};
    const onboardingChecklist = existing?.onboarding_checklist ?? defaultChecklist;

    if (step === 1) {
      personalInfo = sanitizePersonalInfoSSN(payload) as unknown as CaregiverPersonalInfo;
    } else if (step === 2) {
      positionsApplied = (payload.positions_applied as CaregiverPositionType[]) ?? [];
      availability = (payload.availability as CaregiverAvailability) ?? ({} as CaregiverAvailability);
    } else if (step === 3) {
      experienceHistory = (payload.experience_history as WorkExperienceItem[]) ?? [];
      references = (payload.references as ReferenceItem[]) ?? [];
    } else if (step === 4) {
      professionalLicenses = (payload.professional_licenses as ProfessionalLicenseItem[]) ?? [];
    }

    const createdAt = existing?.created_at ?? now;
    const updatedAt = now;

    await db.query(
      `INSERT INTO caregiver_profiles (
        id, user_id, org_id, state_code, application_status, application_step,
        personal_info, positions_applied, availability, experience_history,
        professional_licenses, "references", legal_disclosures, onboarding_checklist,
        assigned_coordinator_id, rejection_reason, submitted_at, approved_at,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, $18,
        $19, $20
      )
      ON CONFLICT (user_id) DO UPDATE SET
        org_id = EXCLUDED.org_id,
        state_code = EXCLUDED.state_code,
        application_status = EXCLUDED.application_status,
        application_step = EXCLUDED.application_step,
        personal_info = EXCLUDED.personal_info,
        positions_applied = EXCLUDED.positions_applied,
        availability = EXCLUDED.availability,
        experience_history = EXCLUDED.experience_history,
        professional_licenses = EXCLUDED.professional_licenses,
        "references" = EXCLUDED."references",
        legal_disclosures = EXCLUDED.legal_disclosures,
        onboarding_checklist = EXCLUDED.onboarding_checklist,
        updated_at = EXCLUDED.updated_at`,
      [
        id,
        userId,
        orgId,
        stateCode,
        applicationStatus,
        applicationStep,
        JSON.stringify(personalInfo),
        JSON.stringify(positionsApplied),
        JSON.stringify(availability),
        JSON.stringify(experienceHistory),
        JSON.stringify(professionalLicenses),
        JSON.stringify(references),
        JSON.stringify(legalDisclosures),
        JSON.stringify(onboardingChecklist),
        existing?.assigned_coordinator_id ?? null,
        existing?.rejection_reason ?? null,
        existing?.submitted_at ?? null,
        existing?.approved_at ?? null,
        createdAt,
        updatedAt,
      ]
    );

    const profile: CaregiverProfile = {
      id,
      user_id: userId,
      org_id: orgId,
      state_code: stateCode,
      application_status: applicationStatus as CaregiverProfile['application_status'],
      application_step: applicationStep,
      personal_info: personalInfo,
      positions_applied: positionsApplied,
      availability: availability,
      experience_history: experienceHistory,
      professional_licenses: professionalLicenses,
      references: references,
      legal_disclosures: legalDisclosures,
      onboarding_checklist: onboardingChecklist,
      assigned_coordinator_id: existing?.assigned_coordinator_id,
      rejection_reason: existing?.rejection_reason,
      submitted_at: existing?.submitted_at,
      approved_at: existing?.approved_at,
      created_at: createdAt,
      updated_at: updatedAt,
    };

    mockCaregiverProfiles.set(userId, profile);
    return profile;
  } catch (err) {
    console.warn('[saveCaregiverDraftDb] Falling back to memory store:', err);
    const profile = storeGetOrCreateProfile(userId, orgId, stateCode);
    const updates: Partial<CaregiverProfile> = {
      application_step: Math.max(profile.application_step, step) as 1 | 2 | 3 | 4 | 5,
    };
    if (step === 1) {
      updates.personal_info = sanitizePersonalInfoSSN(payload) as unknown as CaregiverPersonalInfo;
    } else if (step === 2) {
      updates.positions_applied = (payload.positions_applied as CaregiverPositionType[]) ?? [];
      updates.availability = payload.availability as CaregiverAvailability;
    } else if (step === 3) {
      updates.experience_history = (payload.experience_history as WorkExperienceItem[]) ?? [];
      updates.references = (payload.references as ReferenceItem[]) ?? [];
    } else if (step === 4) {
      updates.professional_licenses = (payload.professional_licenses as ProfessionalLicenseItem[]) ?? [];
    }
    return storeUpdateProfile(userId, updates) ?? profile;
  }
}

/**
 * Retrieves a caregiver profile by userId from PostgreSQL.
 */
export async function getCaregiverProfileDb(userId: string): Promise<CaregiverProfile | null> {
  try {
    await initDb();
    const db = getDb();
    const res = await db.query<Record<string, unknown>>(
      'SELECT * FROM caregiver_profiles WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (!res.rows || res.rows.length === 0) {
      return mockCaregiverProfiles.get(userId) || null;
    }

    const profile = mapRowToCaregiverProfile(res.rows[0]);
    mockCaregiverProfiles.set(userId, profile);
    return profile;
  } catch (err) {
    console.warn('[getCaregiverProfileDb] Falling back to memory store:', err);
    return mockCaregiverProfiles.get(userId) || null;
  }
}

/**
 * Submits a caregiver application (Step 5), updates status to 'submitted',
 * and records legal disclosures in PostgreSQL.
 */
export async function submitCaregiverApplicationDb(
  userId: string,
  legalDisclosures: Partial<LegalDisclosures>
): Promise<CaregiverProfile | null> {
  try {
    await initDb();
    const db = getDb();
    const profile = await getCaregiverProfileDb(userId);
    if (!profile) return null;

    const now = new Date().toISOString();
    const updatedChecklist: OnboardingChecklist = {
      ...profile.onboarding_checklist,
      application_form: 'submitted',
    };

    await db.query(
      `UPDATE caregiver_profiles SET
        application_status = 'submitted',
        application_step = 5,
        legal_disclosures = $2,
        onboarding_checklist = $3,
        submitted_at = $4,
        updated_at = $4
      WHERE user_id = $1`,
      [
        userId,
        JSON.stringify(legalDisclosures),
        JSON.stringify(updatedChecklist),
        now,
      ]
    );

    const updatedProfile: CaregiverProfile = {
      ...profile,
      application_status: 'submitted',
      application_step: 5,
      legal_disclosures: legalDisclosures,
      onboarding_checklist: updatedChecklist,
      submitted_at: now,
      updated_at: now,
    };

    mockCaregiverProfiles.set(userId, updatedProfile);
    return updatedProfile;
  } catch (err) {
    console.warn('[submitCaregiverApplicationDb] Falling back to memory store:', err);
    const existing = mockCaregiverProfiles.get(userId);
    if (!existing) return null;
    return storeUpdateProfile(userId, {
      application_status: 'submitted',
      application_step: 5,
      legal_disclosures: legalDisclosures,
      onboarding_checklist: { ...existing.onboarding_checklist, application_form: 'submitted' },
      submitted_at: new Date().toISOString(),
    });
  }
}

// ─── E-Signature Envelope Queries ───────────────────────────────────────────

/**
 * Creates and stores a new e-signature envelope in PostgreSQL.
 */
export async function createSignatureEnvelopeDb(params: {
  org_id: string;
  template_type: 'caregiver_onboarding_packet' | 'client_service_agreement';
  signer_name: string;
  signer_email: string;
  signer_user_id?: string;
  signer_role?: SignerRole;
  title?: string;
}): Promise<SignatureEnvelope> {
  try {
    await initDb();
    const db = getDb();
    const now = new Date();
    const nowIso = now.toISOString();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const id = `env-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const role: SignerRole =
      params.signer_role ??
      (params.template_type === 'caregiver_onboarding_packet' ? 'caregiver' : 'client_rep');

    const defaultTitle =
      params.title ??
      (params.template_type === 'caregiver_onboarding_packet'
        ? 'Caregiver Onboarding & Attestation Packet'
        : 'Client Home Care Services Agreement');

    await db.query(
      `INSERT INTO signature_envelopes (
        id, org_id, title, template_type, status, signer_role,
        signer_user_id, signer_name, signer_email, expires_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, 'sent', $5,
        $6, $7, $8, $9, $10, $10
      )`,
      [
        id,
        params.org_id,
        defaultTitle,
        params.template_type,
        role,
        params.signer_user_id ?? null,
        params.signer_name,
        params.signer_email,
        expiresAt,
        nowIso,
      ]
    );

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
      created_at: nowIso,
      updated_at: nowIso,
    };

    mockSignatureEnvelopes.set(id, envelope);
    return envelope;
  } catch (err) {
    console.warn('[createSignatureEnvelopeDb] Falling back to memory store:', err);
    return storeCreateEnvelope(params);
  }
}

/**
 * Retrieves a signature envelope by ID from PostgreSQL.
 */
export async function getSignatureEnvelopeDb(id: string): Promise<SignatureEnvelope | null> {
  try {
    await initDb();
    const db = getDb();
    const res = await db.query<Record<string, unknown>>(
      'SELECT * FROM signature_envelopes WHERE id = $1 LIMIT 1',
      [id]
    );

    if (!res.rows || res.rows.length === 0) {
      return storeGetEnvelope(id) || null;
    }

    const envelope = mapRowToSignatureEnvelope(res.rows[0]);
    mockSignatureEnvelopes.set(id, envelope);
    return envelope;
  } catch (err) {
    console.warn('[getSignatureEnvelopeDb] Falling back to memory store:', err);
    return storeGetEnvelope(id) || null;
  }
}

/**
 * Completes and cryptographically stamps an e-signature envelope in PostgreSQL.
 */
export async function completeSignatureEnvelopeDb(
  id: string,
  signatureBase64: string,
  ipAddress?: string,
  userAgent?: string
): Promise<SignatureEnvelope | null> {
  try {
    await initDb();
    const db = getDb();
    const envelope = await getSignatureEnvelopeDb(id);
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

    const clientIp = ipAddress || '127.0.0.1';
    const clientUa = userAgent || 'Crystal-Esign-Client/1.0';

    await db.query(
      `UPDATE signature_envelopes SET
        status = 'completed',
        signature_base64 = $2,
        signed_document_hash = $3,
        ip_address = $4,
        user_agent = $5,
        signed_at = $6,
        updated_at = $6
      WHERE id = $1`,
      [id, signatureBase64, hash, clientIp, clientUa, signedAt]
    );

    const completedEnvelope: SignatureEnvelope = {
      ...envelope,
      status: 'completed',
      signature_base64: signatureBase64,
      signed_document_hash: hash,
      ip_address: clientIp,
      user_agent: clientUa,
      signed_at: signedAt,
      updated_at: signedAt,
    };

    mockSignatureEnvelopes.set(id, completedEnvelope);
    return completedEnvelope;
  } catch (err) {
    console.warn('[completeSignatureEnvelopeDb] Falling back to memory store:', err);
    return storeCompleteEnvelope(id, signatureBase64, ipAddress, userAgent);
  }
}

/**
 * Lists all signature envelopes, optionally filtered by org_id.
 */
export async function listSignatureEnvelopesDb(orgId?: string): Promise<SignatureEnvelope[]> {
  try {
    await initDb();
    const db = getDb();
    let query = 'SELECT * FROM signature_envelopes';
    const params: unknown[] = [];

    if (orgId) {
      query += ' WHERE org_id = $1';
      params.push(orgId);
    }
    query += ' ORDER BY created_at DESC';

    const res = await db.query<Record<string, unknown>>(query, params);
    return (res.rows || []).map(mapRowToSignatureEnvelope);
  } catch (err) {
    console.warn('[listSignatureEnvelopesDb] Falling back to memory store:', err);
    const list = Array.from(mockSignatureEnvelopes.values());
    if (orgId) return list.filter((e) => e.org_id === orgId);
    return list;
  }
}

// ─── Public Inquiries Queries ───────────────────────────────────────────────

/**
 * Saves a public inquiry/lead in PostgreSQL.
 */
export async function savePublicInquiryDb(inquiry: Partial<PublicInquiry> & {
  org_id: string;
  state_code: StateCode;
  full_name: string;
  email: string;
  phone: string;
  inquiry_type: InquiryType;
  message: string;
}): Promise<PublicInquiry> {
  const fullInquiry: PublicInquiry = {
    id: inquiry.id || `inq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    org_id: inquiry.org_id,
    state_code: inquiry.state_code,
    full_name: inquiry.full_name,
    email: inquiry.email,
    phone: inquiry.phone,
    inquiry_type: inquiry.inquiry_type,
    message: inquiry.message,
    source_url: inquiry.source_url ?? '',
    ip_address: inquiry.ip_address,
    status: inquiry.status || 'new',
    notes: inquiry.notes,
    created_at: inquiry.created_at || new Date().toISOString(),
    updated_at: inquiry.updated_at || new Date().toISOString(),
  };

  try {
    await initDb();
    const db = getDb();
    await db.query(
      `INSERT INTO public_inquiries (
        id, org_id, state_code, full_name, email, phone, inquiry_type,
        message, source_url, ip_address, status, notes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        updated_at = EXCLUDED.updated_at`,
      [
        fullInquiry.id,
        fullInquiry.org_id,
        fullInquiry.state_code,
        fullInquiry.full_name,
        fullInquiry.email,
        fullInquiry.phone,
        fullInquiry.inquiry_type,
        fullInquiry.message,
        fullInquiry.source_url,
        fullInquiry.ip_address ?? null,
        fullInquiry.status,
        fullInquiry.notes ?? null,
        fullInquiry.created_at,
        fullInquiry.updated_at,
      ]
    );

    mockInquiries.push(fullInquiry);
    return fullInquiry;
  } catch (err) {
    console.warn('[savePublicInquiryDb] Falling back to memory store:', err);
    mockInquiries.push(fullInquiry);
    return fullInquiry;
  }
}

/**
 * Lists public inquiries from PostgreSQL with optional filtering.
 */
export async function listPublicInquiriesDb(
  orgId?: string,
  stateCode?: string
): Promise<PublicInquiry[]> {
  try {
    await initDb();
    const db = getDb();
    let query = 'SELECT * FROM public_inquiries WHERE 1=1';
    const params: unknown[] = [];

    if (orgId) {
      params.push(orgId);
      query += ` AND org_id = $${params.length}`;
    }
    if (stateCode) {
      params.push(stateCode);
      query += ` AND state_code = $${params.length}`;
    }
    query += ' ORDER BY created_at DESC';

    const res = await db.query<Record<string, unknown>>(query, params);
    return (res.rows || []).map(mapRowToPublicInquiry);
  } catch (err) {
    console.warn('[listPublicInquiriesDb] Falling back to memory store:', err);
    let results = [...mockInquiries];
    if (orgId) results = results.filter((i) => i.org_id === orgId);
    if (stateCode) results = results.filter((i) => i.state_code === stateCode);
    return results;
  }
}

// ─── Caregiver Documents & Compliance Queries (Spec 03) ──────────────────────

/**
 * Saves a caregiver document in PostgreSQL and updates memory cache.
 */
export async function saveCaregiverDocumentDb(doc: Partial<CaregiverDocument> & {
  caregiver_id: string;
  org_id: string;
  category: DocumentCategoryType;
  file_storage_path: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
}): Promise<CaregiverDocument> {
  const id = doc.id || `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const fullDoc: CaregiverDocument = {
    id,
    caregiver_id: doc.caregiver_id,
    org_id: doc.org_id,
    category: doc.category,
    file_storage_path: doc.file_storage_path,
    file_name: doc.file_name,
    file_size_bytes: doc.file_size_bytes,
    mime_type: doc.mime_type,
    issue_date: doc.issue_date,
    expiration_date: doc.expiration_date,
    has_no_expiration: doc.has_no_expiration ?? false,
    verification_status: doc.verification_status || 'under_review',
    verified_by: doc.verified_by,
    verified_at: doc.verified_at,
    rejection_reason: doc.rejection_reason,
    ocr_extracted_data: doc.ocr_extracted_data,
    is_archived: doc.is_archived ?? false,
    created_at: doc.created_at || now,
    updated_at: doc.updated_at || now,
  };

  const enriched = enrichDocumentWithExpiration(fullDoc);

  try {
    await initDb();
    const db = getDb();
    await db.query(
      `INSERT INTO caregiver_documents (
        id, caregiver_id, org_id, category, file_storage_path, file_name,
        file_size_bytes, mime_type, issue_date, expiration_date, has_no_expiration,
        verification_status, verified_by, verified_at, rejection_reason,
        ocr_extracted_data, is_archived, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15,
        $16, $17, $18, $19
      )
      ON CONFLICT (id) DO UPDATE SET
        category = EXCLUDED.category,
        file_storage_path = EXCLUDED.file_storage_path,
        file_name = EXCLUDED.file_name,
        file_size_bytes = EXCLUDED.file_size_bytes,
        mime_type = EXCLUDED.mime_type,
        issue_date = EXCLUDED.issue_date,
        expiration_date = EXCLUDED.expiration_date,
        has_no_expiration = EXCLUDED.has_no_expiration,
        verification_status = EXCLUDED.verification_status,
        verified_by = EXCLUDED.verified_by,
        verified_at = EXCLUDED.verified_at,
        rejection_reason = EXCLUDED.rejection_reason,
        ocr_extracted_data = EXCLUDED.ocr_extracted_data,
        is_archived = EXCLUDED.is_archived,
        updated_at = EXCLUDED.updated_at`,
      [
        enriched.id,
        enriched.caregiver_id,
        enriched.org_id,
        enriched.category,
        enriched.file_storage_path,
        enriched.file_name,
        enriched.file_size_bytes,
        enriched.mime_type,
        enriched.issue_date || null,
        enriched.expiration_date || null,
        enriched.has_no_expiration,
        enriched.verification_status,
        enriched.verified_by || null,
        enriched.verified_at || null,
        enriched.rejection_reason || null,
        JSON.stringify(enriched.ocr_extracted_data || {}),
        enriched.is_archived,
        enriched.created_at,
        enriched.updated_at,
      ]
    );

    mockCaregiverDocuments.set(enriched.id, enriched);
    return enriched;
  } catch (err) {
    console.warn('[saveCaregiverDocumentDb] Falling back to memory store:', err);
    mockCaregiverDocuments.set(enriched.id, enriched);
    return enriched;
  }
}

/**
 * Retrieves all documents for a caregiver.
 */
export async function getCaregiverDocumentsDb(
  caregiverId: string,
  category?: DocumentCategoryType
): Promise<CaregiverDocument[]> {
  try {
    await initDb();
    const db = getDb();
    let query = 'SELECT * FROM caregiver_documents WHERE caregiver_id = $1 AND is_archived = false';
    const params: unknown[] = [caregiverId];

    if (category) {
      query += ' AND category = $2';
      params.push(category);
    }
    query += ' ORDER BY created_at DESC';

    const res = await db.query<Record<string, unknown>>(query, params);
    const docs = (res.rows || []).map(mapRowToCaregiverDocument);
    docs.forEach((d) => mockCaregiverDocuments.set(d.id, d));
    return docs;
  } catch (err) {
    console.warn('[getCaregiverDocumentsDb] Falling back to memory store:', err);
    const all = Array.from(mockCaregiverDocuments.values()).filter(
      (d) => d.caregiver_id === caregiverId && !d.is_archived
    );
    if (category) return all.filter((d) => d.category === category);
    return all.map(enrichDocumentWithExpiration);
  }
}

/**
 * Reviews (approves/rejects) a caregiver document.
 */
export async function reviewCaregiverDocumentDb(params: {
  document_id: string;
  decision: 'approved' | 'rejected';
  rejection_reason?: string;
  verified_by?: string;
  corrected_expiration_date?: string;
}): Promise<CaregiverDocument | null> {
  const now = new Date().toISOString();
  try {
    await initDb();
    const db = getDb();

    let query = `UPDATE caregiver_documents SET
      verification_status = $2,
      rejection_reason = $3,
      verified_by = $4,
      verified_at = $5,
      updated_at = $5`;
    const values: unknown[] = [
      params.document_id,
      params.decision,
      params.decision === 'rejected' ? params.rejection_reason : null,
      params.verified_by || 'coordinator',
      now,
    ];

    if (params.corrected_expiration_date) {
      query += `, expiration_date = $6 WHERE id = $1`;
      values.push(params.corrected_expiration_date);
    } else {
      query += ` WHERE id = $1`;
    }

    await db.query(query, values);

    const updated = await db.query<Record<string, unknown>>(
      'SELECT * FROM caregiver_documents WHERE id = $1 LIMIT 1',
      [params.document_id]
    );

    if (updated.rows && updated.rows.length > 0) {
      const doc = mapRowToCaregiverDocument(updated.rows[0]);
      mockCaregiverDocuments.set(doc.id, doc);
      return doc;
    }
  } catch (err) {
    console.warn('[reviewCaregiverDocumentDb] Falling back to memory store:', err);
  }

  // Memory fallback
  const existing = mockCaregiverDocuments.get(params.document_id);
  if (!existing) return null;

  const doc: CaregiverDocument = {
    ...existing,
    verification_status: params.decision,
    rejection_reason: params.decision === 'rejected' ? params.rejection_reason : undefined,
    expiration_date: params.corrected_expiration_date || existing.expiration_date,
    verified_by: params.verified_by || 'coordinator',
    verified_at: now,
    updated_at: now,
  };
  const enriched = enrichDocumentWithExpiration(doc);
  mockCaregiverDocuments.set(enriched.id, enriched);
  return enriched;
}

/**
 * Calculates compliance score for a caregiver.
 */
export async function getComplianceScoreDb(caregiverId: string): Promise<ComplianceScore> {
  const docs = await getCaregiverDocumentsDb(caregiverId);
  return calculateComplianceScore(caregiverId, docs);
}

/**
 * Logs an immutable document audit log entry in PostgreSQL.
 */
export async function logDocumentAuditDb(params: {
  document_id: string;
  user_id: string;
  action: DocumentAuditActionType;
  ip_address?: string;
  user_agent?: string;
}): Promise<DocumentAuditLog> {
  const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const auditLog: DocumentAuditLog = {
    id,
    document_id: params.document_id,
    user_id: params.user_id,
    action: params.action,
    ip_address: params.ip_address || '127.0.0.1',
    user_agent: params.user_agent || 'Crystal-Doc-Service/1.0',
    created_at: now,
  };

  try {
    await initDb();
    const db = getDb();
    await db.query(
      `INSERT INTO document_audit_logs (id, document_id, user_id, action, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        auditLog.id,
        auditLog.document_id,
        auditLog.user_id,
        auditLog.action,
        auditLog.ip_address,
        auditLog.user_agent,
        auditLog.created_at,
      ]
    );
  } catch (err) {
    console.warn('[logDocumentAuditDb] Falling back to memory store:', err);
  }

  mockDocumentAuditLogs.push(auditLog);
  return auditLog;
}

// ─── Training Module & Progress Database Operations (Feature Spec 04) ────────

export async function listTrainingModulesDb(stateCode?: string): Promise<TrainingModule[]> {
  try {
    await initDb();
    const db = getDb();
    let query = 'SELECT * FROM training_modules WHERE is_active = true';
    const params: unknown[] = [];
    if (stateCode && stateCode !== 'ALL') {
      query += ' AND (state_code = $1 OR state_code = \'ALL\')';
      params.push(stateCode);
    }
    query += ' ORDER BY required_hours DESC, title ASC';
    const res = await db.query<any>(query, params);
    if (res.rows && res.rows.length > 0) {
      return res.rows.map((r) => ({
        id: r.id,
        org_id: r.org_id,
        state_code: r.state_code,
        title: r.title,
        description: r.description,
        category: r.category,
        video_url: r.video_url,
        video_duration_seconds: Number(r.video_duration_seconds),
        required_hours: Number(r.required_hours),
        passing_score_percentage: Number(r.passing_score_percentage),
        quiz_questions: parseJson(r.quiz_questions),
        is_mandatory: Boolean(r.is_mandatory),
        is_active: Boolean(r.is_active),
        created_at: r.created_at,
      }));
    }
  } catch (err) {
    console.warn('[listTrainingModulesDb] Falling back to memory store:', err);
  }
  return storeGetTrainingModules(stateCode);
}

export async function getTrainingModuleDb(id: string): Promise<TrainingModule | undefined> {
  try {
    await initDb();
    const db = getDb();
    const res = await db.query<any>('SELECT * FROM training_modules WHERE id = $1', [id]);
    if (res.rows && res.rows.length > 0) {
      const r = res.rows[0];
      return {
        id: r.id,
        org_id: r.org_id,
        state_code: r.state_code,
        title: r.title,
        description: r.description,
        category: r.category,
        video_url: r.video_url,
        video_duration_seconds: Number(r.video_duration_seconds),
        required_hours: Number(r.required_hours),
        passing_score_percentage: Number(r.passing_score_percentage),
        quiz_questions: parseJson(r.quiz_questions),
        is_mandatory: Boolean(r.is_mandatory),
        is_active: Boolean(r.is_active),
        created_at: r.created_at,
      };
    }
  } catch (err) {
    console.warn('[getTrainingModuleDb] Falling back to memory store:', err);
  }
  return storeGetTrainingModuleById(id);
}

export async function updateTrainingProgressDb(
  caregiverId: string,
  moduleId: string,
  watchSeconds: number,
  totalDurationSeconds: number
): Promise<CaregiverTrainingProgress> {
  const memoryResult = storeUpdateTrainingProgress(
    caregiverId,
    moduleId,
    watchSeconds,
    totalDurationSeconds
  );

  try {
    await initDb();
    const db = getDb();
    await db.query(
      `INSERT INTO caregiver_training_progress (
         id, caregiver_id, module_id, watch_progress_percentage, video_completed,
         quiz_attempts, quiz_score_percentage, passed, certificate_url, certificate_hash,
         completed_at, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (caregiver_id, module_id) DO UPDATE SET
         watch_progress_percentage = GREATEST(caregiver_training_progress.watch_progress_percentage, EXCLUDED.watch_progress_percentage),
         video_completed = caregiver_training_progress.video_completed OR EXCLUDED.video_completed,
         updated_at = EXCLUDED.updated_at`,
      [
        memoryResult.id,
        memoryResult.caregiver_id,
        memoryResult.module_id,
        memoryResult.watch_progress_percentage,
        memoryResult.video_completed,
        memoryResult.quiz_attempts,
        memoryResult.quiz_score_percentage,
        memoryResult.passed,
        memoryResult.certificate_url,
        memoryResult.certificate_hash,
        memoryResult.completed_at,
        memoryResult.created_at,
        memoryResult.updated_at,
      ]
    );
  } catch (err) {
    console.warn('[updateTrainingProgressDb] Falling back to memory store:', err);
  }

  return memoryResult;
}

export async function getCaregiverTrainingProgressDb(caregiverId: string): Promise<CaregiverTrainingProgress[]> {
  try {
    await initDb();
    const db = getDb();
    const res = await db.query<any>(
      'SELECT * FROM caregiver_training_progress WHERE caregiver_id = $1',
      [caregiverId]
    );
    if (res.rows && res.rows.length > 0) {
      return res.rows.map((r) => ({
        id: r.id,
        caregiver_id: r.caregiver_id,
        module_id: r.module_id,
        watch_progress_percentage: Number(r.watch_progress_percentage),
        video_completed: Boolean(r.video_completed),
        quiz_attempts: Number(r.quiz_attempts),
        quiz_score_percentage: r.quiz_score_percentage !== null ? Number(r.quiz_score_percentage) : null,
        passed: Boolean(r.passed),
        certificate_url: r.certificate_url,
        certificate_hash: r.certificate_hash,
        completed_at: r.completed_at,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));
    }
  } catch (err) {
    console.warn('[getCaregiverTrainingProgressDb] Falling back to memory store:', err);
  }
  return storeGetCaregiverTrainingProgress(caregiverId);
}

export async function submitTrainingQuizDb(
  caregiverId: string,
  moduleId: string,
  answers: Array<{ question_id: string; selected_index: number }>
): Promise<QuizResultResponse> {
  const result = storeSubmitTrainingQuiz(caregiverId, moduleId, answers);
  const record = storeGetCaregiverTrainingProgress(caregiverId).find((p) => p.module_id === moduleId);

  if (record) {
    try {
      await initDb();
      const db = getDb();
      await db.query(
        `INSERT INTO caregiver_training_progress (
           id, caregiver_id, module_id, watch_progress_percentage, video_completed,
           quiz_attempts, quiz_score_percentage, passed, certificate_url, certificate_hash,
           completed_at, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (caregiver_id, module_id) DO UPDATE SET
           quiz_attempts = EXCLUDED.quiz_attempts,
           quiz_score_percentage = EXCLUDED.quiz_score_percentage,
           passed = EXCLUDED.passed,
           certificate_url = COALESCE(EXCLUDED.certificate_url, caregiver_training_progress.certificate_url),
           certificate_hash = COALESCE(EXCLUDED.certificate_hash, caregiver_training_progress.certificate_hash),
           completed_at = COALESCE(EXCLUDED.completed_at, caregiver_training_progress.completed_at),
           updated_at = EXCLUDED.updated_at`,
        [
          record.id,
          record.caregiver_id,
          record.module_id,
          record.watch_progress_percentage,
          record.video_completed,
          record.quiz_attempts,
          record.quiz_score_percentage,
          record.passed,
          record.certificate_url,
          record.certificate_hash,
          record.completed_at,
          record.created_at,
          record.updated_at,
        ]
      );
    } catch (err) {
      console.warn('[submitTrainingQuizDb] Falling back to memory store:', err);
    }
  }

  return result;
}

export async function getTrainingComplianceSummaryDb(
  caregiverId: string,
  stateCode: string = 'GA'
): Promise<TrainingComplianceSummary> {
  return storeGetTrainingComplianceSummary(caregiverId, stateCode);
}

// ─── Client Intake & Document Management DB Operations (Feature Spec 05) ──────

export async function createClientProfileDb(input: ClientIntakeInput): Promise<ClientProfile> {
  const profile = storeCreateClientProfile(input);

  try {
    await initDb();
    const db = getDb();
    await db.query(
      `INSERT INTO clients (
         id, org_id, state_code, status, first_name, middle_name, last_name,
         dob, gender, ssn_last4, medicaid_id, primary_phone, service_address,
         emergency_contacts, primary_physician, care_needs, primary_payer, payer_details,
         created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
      [
        profile.id,
        profile.org_id,
        profile.state_code,
        profile.status,
        profile.first_name,
        profile.middle_name || null,
        profile.last_name,
        profile.dob,
        profile.gender || null,
        profile.ssn_last4 || null,
        profile.medicaid_id || null,
        profile.primary_phone,
        JSON.stringify(profile.service_address),
        JSON.stringify(profile.emergency_contacts),
        JSON.stringify(profile.primary_physician),
        JSON.stringify(profile.care_needs),
        profile.primary_payer,
        JSON.stringify(profile.payer_details || {}),
        profile.created_at,
        profile.updated_at,
      ]
    );
  } catch (err) {
    console.warn('[createClientProfileDb] Falling back to memory store:', err);
  }

  return profile;
}

export async function getClientProfileDb(id: string): Promise<ClientProfile | undefined> {
  try {
    await initDb();
    const db = getDb();
    const res = await db.query<any>('SELECT * FROM clients WHERE id = $1', [id]);
    if (res.rows && res.rows.length > 0) {
      const r = res.rows[0];
      return {
        id: r.id,
        org_id: r.org_id,
        state_code: r.state_code,
        status: r.status,
        first_name: r.first_name,
        middle_name: r.middle_name,
        last_name: r.last_name,
        dob: r.dob instanceof Date ? r.dob.toISOString().split('T')[0] : String(r.dob),
        gender: r.gender,
        ssn_last4: r.ssn_last4,
        medicaid_id: r.medicaid_id,
        primary_phone: r.primary_phone,
        service_address: parseJson(r.service_address),
        emergency_contacts: parseJson(r.emergency_contacts),
        primary_physician: parseJson(r.primary_physician),
        care_needs: parseJson(r.care_needs),
        primary_payer: r.primary_payer,
        payer_details: parseJson(r.payer_details),
        assigned_rn_id: r.assigned_rn_id,
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    }
  } catch (err) {
    console.warn('[getClientProfileDb] Falling back to memory store:', err);
  }
  return storeGetClientProfile(id);
}

export async function listClientsDb(orgId?: string, stateCode?: string): Promise<ClientProfile[]> {
  try {
    await initDb();
    const db = getDb();
    let query = 'SELECT * FROM clients WHERE 1=1';
    const params: unknown[] = [];
    if (orgId) {
      params.push(orgId);
      query += ` AND org_id = $${params.length}`;
    }
    if (stateCode) {
      params.push(stateCode);
      query += ` AND state_code = $${params.length}`;
    }
    query += ' ORDER BY created_at DESC';
    const res = await db.query<any>(query, params);
    if (res.rows && res.rows.length > 0) {
      return res.rows.map((r) => ({
        id: r.id,
        org_id: r.org_id,
        state_code: r.state_code,
        status: r.status,
        first_name: r.first_name,
        middle_name: r.middle_name,
        last_name: r.last_name,
        dob: r.dob instanceof Date ? r.dob.toISOString().split('T')[0] : String(r.dob),
        gender: r.gender,
        ssn_last4: r.ssn_last4,
        medicaid_id: r.medicaid_id,
        primary_phone: r.primary_phone,
        service_address: parseJson(r.service_address),
        emergency_contacts: parseJson(r.emergency_contacts),
        primary_physician: parseJson(r.primary_physician),
        care_needs: parseJson(r.care_needs),
        primary_payer: r.primary_payer,
        payer_details: parseJson(r.payer_details),
        assigned_rn_id: r.assigned_rn_id,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));
    }
  } catch (err) {
    console.warn('[listClientsDb] Falling back to memory store:', err);
  }
  return storeListClients(orgId, stateCode);
}

export async function uploadClientDocumentDb(
  doc: Omit<ClientDocument, 'id' | 'created_at'>
): Promise<ClientDocument> {
  const newDoc = storeUploadClientDocument(doc);
  try {
    await initDb();
    const db = getDb();
    await db.query(
      `INSERT INTO client_documents (
         id, client_id, org_id, doc_type, file_storage_path, file_name,
         file_size_bytes, mime_type, effective_date, expiration_date, uploaded_by, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        newDoc.id,
        newDoc.client_id,
        newDoc.org_id,
        newDoc.doc_type,
        newDoc.file_storage_path,
        newDoc.file_name,
        newDoc.file_size_bytes,
        newDoc.mime_type,
        newDoc.effective_date || null,
        newDoc.expiration_date || null,
        newDoc.uploaded_by || null,
        newDoc.created_at,
      ]
    );
  } catch (err) {
    console.warn('[uploadClientDocumentDb] Falling back to memory store:', err);
  }
  return newDoc;
}

export async function listClientDocumentsDb(clientId: string): Promise<ClientDocument[]> {
  try {
    await initDb();
    const db = getDb();
    const res = await db.query<any>(
      'SELECT * FROM client_documents WHERE client_id = $1 ORDER BY created_at DESC',
      [clientId]
    );
    if (res.rows && res.rows.length > 0) {
      return res.rows.map((r) => ({
        id: r.id,
        client_id: r.client_id,
        org_id: r.org_id,
        doc_type: r.doc_type,
        file_storage_path: r.file_storage_path,
        file_name: r.file_name,
        file_size_bytes: Number(r.file_size_bytes),
        mime_type: r.mime_type,
        effective_date: r.effective_date ? (r.effective_date instanceof Date ? r.effective_date.toISOString().split('T')[0] : String(r.effective_date)) : undefined,
        expiration_date: r.expiration_date ? (r.expiration_date instanceof Date ? r.expiration_date.toISOString().split('T')[0] : String(r.expiration_date)) : undefined,
        uploaded_by: r.uploaded_by,
        created_at: r.created_at,
      }));
    }
  } catch (err) {
    console.warn('[listClientDocumentsDb] Falling back to memory store:', err);
  }
  return storeListClientDocuments(clientId);
}

// ─── Client Prior Authorizations Database Queries (Feature Spec 06) ──────────

function mapAuthorizationRow(r: any): ClientAuthorization {
  return {
    id: r.id,
    client_id: r.client_id,
    org_id: r.org_id,
    payer_name: r.payer_name,
    authorization_number: r.authorization_number,
    procedure_code: r.procedure_code,
    service_type: r.service_type,
    start_date: r.start_date instanceof Date ? r.start_date.toISOString().split('T')[0] : String(r.start_date),
    end_date: r.end_date instanceof Date ? r.end_date.toISOString().split('T')[0] : String(r.end_date),
    total_units_authorized: Number(r.total_units_authorized),
    total_units_used: Number(r.total_units_used || 0),
    weekly_hours_cap: r.weekly_hours_cap !== null && r.weekly_hours_cap !== undefined ? Number(r.weekly_hours_cap) : undefined,
    status: r.status as AuthStatusType,
    notes: r.notes || undefined,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export async function createClientAuthorizationDb(
  input: CreateAuthorizationInput
): Promise<ClientAuthorization> {
  const newAuth = storeCreateAuthorization(input);
  try {
    await initDb();
    const db = getDb();
    await db.query(
      `INSERT INTO client_authorizations (
         id, client_id, org_id, payer_name, authorization_number, procedure_code,
         service_type, start_date, end_date, total_units_authorized, total_units_used,
         weekly_hours_cap, status, notes, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        newAuth.id,
        newAuth.client_id,
        newAuth.org_id,
        newAuth.payer_name,
        newAuth.authorization_number,
        newAuth.procedure_code,
        newAuth.service_type,
        newAuth.start_date,
        newAuth.end_date,
        newAuth.total_units_authorized,
        newAuth.total_units_used,
        newAuth.weekly_hours_cap || null,
        newAuth.status,
        newAuth.notes || null,
        newAuth.created_at,
        newAuth.updated_at,
      ]
    );
  } catch (err) {
    console.warn('[createClientAuthorizationDb] Falling back to memory store:', err);
  }
  return newAuth;
}

export async function getClientAuthorizationsDb(
  clientId?: string,
  orgId?: string,
  status?: AuthStatusType
): Promise<ClientAuthorization[]> {
  try {
    await initDb();
    const db = getDb();
    let query = 'SELECT * FROM client_authorizations WHERE 1=1';
    const params: any[] = [];
    if (clientId) {
      params.push(clientId);
      query += ` AND client_id = $${params.length}`;
    }
    if (orgId) {
      params.push(orgId);
      query += ` AND org_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    query += ' ORDER BY end_date ASC';

    const res = await db.query<any>(query, params);
    if (res.rows && res.rows.length > 0) {
      return res.rows.map(mapAuthorizationRow);
    }
  } catch (err) {
    console.warn('[getClientAuthorizationsDb] Falling back to memory store:', err);
  }
  return storeGetAuthorizations(clientId, orgId, status);
}

export async function getClientAuthorizationByIdDb(
  id: string
): Promise<ClientAuthorization | null> {
  try {
    await initDb();
    const db = getDb();
    const res = await db.query<any>(
      'SELECT * FROM client_authorizations WHERE id = $1',
      [id]
    );
    if (res.rows && res.rows[0]) {
      return mapAuthorizationRow(res.rows[0]);
    }
  } catch (err) {
    console.warn('[getClientAuthorizationByIdDb] Falling back to memory store:', err);
  }
  const fallback = storeGetAuthorizationById(id);
  return fallback || null;
}

export async function logAuthorizationUtilizationDb(
  id: string,
  input: LogUtilizationInput
): Promise<{ success: boolean; authorization?: ClientAuthorization; summary?: AuthorizationUtilizationSummary; error?: string }> {
  const memoryResult = storeLogUtilization(id, input);
  if (!memoryResult.success) {
    return memoryResult;
  }

  try {
    await initDb();
    const db = getDb();
    const auth = memoryResult.authorization!;
    await db.query(
      `UPDATE client_authorizations
       SET total_units_used = $1, status = $2, updated_at = $3
       WHERE id = $4`,
      [auth.total_units_used, auth.status, auth.updated_at, id]
    );
  } catch (err) {
    console.warn('[logAuthorizationUtilizationDb] Falling back to memory store:', err);
  }

  return memoryResult;
}

export async function getExpiringAuthorizationsDb(
  orgId?: string,
  daysThreshold: number = 60
): Promise<Array<ClientAuthorization & { summary: AuthorizationUtilizationSummary }>> {
  try {
    await initDb();
    const db = getDb();
    const res = await db.query<any>(
      `SELECT * FROM client_authorizations
       WHERE ($1::uuid IS NULL OR org_id = $1::uuid)
         AND (end_date <= (CURRENT_DATE + ($2 || ' days')::interval) OR status IN ('expiring_soon', 'exhausted'))
       ORDER BY end_date ASC`,
      [orgId || null, daysThreshold]
    );
    if (res.rows && res.rows.length > 0) {
      return res.rows.map((r) => {
        const auth = mapAuthorizationRow(r);
        return {
          ...auth,
          summary: storeComputeAuthSummary(auth),
        };
      });
    }
  } catch (err) {
    console.warn('[getExpiringAuthorizationsDb] Falling back to memory store:', err);
  }
  return storeGetExpiringAuthorizations(orgId, daysThreshold);
}

export async function getAuthorizationSummaryDb(
  id: string
): Promise<AuthorizationUtilizationSummary | null> {
  const auth = await getClientAuthorizationByIdDb(id);
  if (!auth) return null;
  return storeComputeAuthSummary(auth);
}



