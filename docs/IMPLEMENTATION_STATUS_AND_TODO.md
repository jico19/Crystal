# Crystal Platform — Specs Implementation Status & Master To-Do List

> **Last Updated:** September 6, 2026  
> **Source Directory:** `docs/specs/` (Specs 01 through 10)  
> **Current Overall Completion:** **80 / 80 tasks (100%)**

---

## 1. Executive Status Dashboard

| Spec ID | Name | Tasks Done | Total Tasks | Status | Key Deliverables |
|:---|:---|:---:|:---:|:---:|:---|
| **01** | [Multi-State Website & Routing](01-multi-state-website-routing/SPEC.md) | 6 | 6 | ✅ Complete | DB Migration 001, Seed data, Org/Inquiry APIs, GA/IN SPAs, Contact Form |
| **02** | [Caregiver Application & Onboarding](02-caregiver-application-onboarding/SPEC.md) | 10 | 10 | ✅ Complete | DB Migration 002, Draft/Submit APIs, 5-step React Wizard in GA & IN |
| **03** | [Caregiver Documents & Credential Tracking](03-caregiver-documents-credential-tracking/SPEC.md) | 8 | 8 | ✅ Complete | Presigned S3/local upload/download, OCR hook, Verification workflow, Checklist UI |
| **04** | [In-Service Training Portal](04-in-service-training-portal/SPEC.md) | 9 | 9 | ✅ Complete | Anti-skip video progress, Quiz engine (80% pass), SHA-256 cert generator |
| **05** | [Client Intake & Document Management](05-client-intake-documents/SPEC.md) | 9 | 9 | ✅ Complete | Migration 006, Emergency contacts, Care needs, Clinical doc vault, Client roster UI |
| **06** | [Client Prior Authorization Management](06-client-authorization-management/SPEC.md) | 8 | 8 | ✅ Complete | Migration 007, 15m/unit burndown, Unit logs, 30-day expiration cron, Burndown UI |
| **07** | [Admin Dashboard & State Reporting](07-admin-dashboard-reporting/SPEC.md) | 7 | 7 | ✅ Complete | Migration 010 view, Multi-state KPI metrics, CSV survey export, AdminCommandCenter |
| **08** | [Notifications & Automation Engine](08-notifications-automation-engine/SPEC.md) | 8 | 8 | ✅ Complete | Migration 008, Outbox processor, Exponential backoff, SMS PHI stripping, Bell UI |
| **09** | [E-Signature Workflow](09-esignature-workflow/SPEC.md) | 8 | 8 | ✅ Complete | Migration 009, Envelopes, SignatureCanvasPad, E-SIGN consent, SHA-256 seal |
| **10** | [RBAC, Security & HIPAA Audit Trail](10-rbac-security-audit/SPEC.md) | 7 | 7 | ✅ Complete | Migration 003, requireRole/requireOrg guards, audit service, lockout cron, UI |

---

## 2. Detailed Breakdown: What Is Implemented

### Spec 01: Multi-State Website & Dedicated Domain Routing (100%)
- [x] **Database:**
  - `db_schema/migrations/001_organizations_and_public_inquiries.sql`: DDL for `organizations` and `public_inquiries`, RLS policies for public read and anonymous lead submission, indexes.
  - `db_schema/seed_organizations.sql`: Seed data for Georgia (*With Open Hands*) and Indiana (*Cherish Open Arms*).
- [x] **API (`apps/api`):**
  - `GET /api/v1/organizations/by-domain`: Resolves active organization and branding by host domain.
  - `POST /api/v1/inquiries`: Public lead capture with honeypot spam protection and Amazon SES notifications.
- [x] **Frontend (`apps/georgia` & `apps/indiana`):**
  - `OrgThemeContext.tsx`: Injects dynamic state brand tokens into CSS `:root`.
  - Public layout with header, footer, navigation, and cross-state switcher.
  - Public pages: Home, About, Services, Contact, and Login.
  - `ContactForm.tsx`: Validated contact form with honeypot field.

### Spec 02: Caregiver Application & Onboarding Funnel (100%)
- [x] **Database:**
  - `db_schema/migrations/002_caregiver_profiles.sql`: DDL for `caregiver_profiles`, enums `caregiver_status_type` and `onboarding_step_status_type`, RLS policies, automated `updated_at` trigger.
- [x] **API (`apps/api`):**
  - `POST /api/v1/caregivers/application`: Initializes/upserts draft applicant profile (Step 1) with SSN masking/sanitization.
  - `PUT /api/v1/caregivers/application/draft`: Saves incremental draft steps (Step 2 Availability, Step 3 Experience & References, Step 4 Licensure).
  - `POST /api/v1/caregivers/application/submit`: Finalizes submission (Step 5 Disclosures & Legal Attestation), performs whole-profile Zod validation, transitions status to `submitted`, and sends SES notifications.
- [x] **Validation (`packages/validation`):**
  - Complete step schemas: `PersonalInfoStepSchema`, `AvailabilityStepSchema`, `ExperienceStepSchema`, `LicensesStepSchema`, `LegalDisclosuresStepSchema`, and `CompleteCaregiverApplicationSchema`.
- [x] **Frontend (`apps/georgia` & `apps/indiana`):**
  - `ApplyWizardLayout.tsx`, `StepIndicator.tsx`, and `WizardHeader.tsx`.
  - 5 interactive step components with error handling and auto-saving:
    - Step 1: Personal Info & Address
    - Step 2: Positions & Schedule Availability
    - Step 3: Work History & Professional References
    - Step 4: Professional Licenses
    - Step 5: Disclosures, Consents & Typed Signature
  - Submission confirmation screen with reference ID and onboarding next steps.

### Spec 10: RBAC, Security & Audit (Partial: ~14%)
- [x] **Basic JWT Middleware:**
  - `apps/api/src/middleware/auth.middleware.ts`: `verifyJWT` validates Bearer token and populates `req.user`.

---

## 3. What Is NOT Implemented (Technical Gaps)

1. **Shared Packages:**
   - `packages/ui`: Currently empty placeholder; shared UI elements (inputs, buttons, modals, badges) are duplicated across `apps/georgia` and `apps/indiana`.
   - `packages/types`: Only defines `Organization`, `OfficeAddress`, and `BrandingTheme`. Lacks interfaces for Caregivers, Documents, Training, Clients, Authorizations, Admin KPIs, Notifications, and E-Sign envelopes.
2. **Missing Applications:**
   - `apps/admin`: Master executive and state director command center does not exist.
3. **Features & Infrastructure (Specs 03–10):**
   - No AWS S3 presigned URL generation or file verification pipelines.
   - No LMS training module player, quiz scoring, or PDF certificate generator.
   - No client clinical intake, emergency contacts, or Medicaid payer vault.
   - No authorization unit tracking (15-min increments) or burndown calculations.
   - No notification outbox queue, `node-cron` workers, or Twilio SMS integration.
   - No E-Signature pad, SHA-256 tamper verification, or webhook listeners.
   - No role-based endpoint guards (`requireRole`, `requireOrg`) or immutable security audit logging table.

---

## 4. Master Implementation To-Do List

### Phase 1: Shared Core, Types & Security Foundation (Prerequisites)
- [x] **1.1 Shared Component Library (`packages/ui`)**
  - [x] Consolidate common UI components from SPAs: `Button`, `Input`, `Card`, `Badge`, `Modal`, `StepIndicator`, `RepeaterField`.
  - [x] Standardize theme styling with Tailwind CSS and CSS variables.
- [x] **1.2 Shared Types (`packages/types`)**
  - [x] Export TypeScript DTOs and interfaces for Caregivers, Documents, Training, Clients, Authorizations, Notifications, and E-Sign.
- [x] **1.3 Spec 10: RBAC & Audit Trail**
  - [x] Migration `003_user_profiles_and_audit_logs.sql`:
    - `user_profiles` table (`id`, `org_id`, `role`, `failed_login_attempts`, `locked_until`).
    - `security_audit_logs` table (`user_id`, `org_id`, `action`, `resource_type`, `resource_id`, `ip_address`, `metadata`).
  - [x] Add `requireRole(allowedRoles[])` and `requireOrg` guards in `apps/api/src/middleware/auth.middleware.ts`.
  - [x] Create `apps/api/src/modules/audit/audit.service.ts` for append-only audit logging.
  - [x] Add cron worker for automatic account unlocking / lockout checks.
  - [x] Build Admin Role Assignment & Audit Log Viewer UI.

---

### Phase 2: Caregiver Operations & Training
- [x] **2.1 Spec 03: Caregiver Documents & Credential Tracking**
  - [x] Migration `004_caregiver_documents.sql`:
    - `caregiver_documents` table and `document_audit_logs` table.
    - Document category & verification status enums.
  - [x] Add Zod schemas: `DocumentUploadSchema` and `DocumentReviewSchema` in `@crystal/validation`.
  - [x] S3 storage service in API: presigned PUT URL (`/upload-url`) and presigned GET URL (`/download`).
  - [x] API routes: `POST /confirm`, `PATCH /review`, and compliance score calculator.
  - [x] Frontend components: `DocumentChecklistTable`, `DocumentUploadModal`, and `ComplianceScoreBanner`.
- [x] **2.2 Spec 04: In-Service Training Portal**
  - [x] Migration `005_training_portal.sql`:
    - `training_modules` (with JSONB quiz questions) and `caregiver_training_progress` tables.
  - [x] Add Zod schemas: `QuizSubmissionSchema` and `VideoProgressUpdateSchema`.
  - [x] API routes:
    - `GET /api/v1/training/modules` (catalog).
    - `POST /api/v1/training/progress` (anti-skip progress update).
    - `POST /api/v1/training/quiz/submit` (80% passing grade check).
    - `GET /api/v1/training/certificates/:id` (PDF generator with SHA-256 hash).
  - [x] Frontend components: `TrainingPortalCatalog`, `VideoPlayerWithProgress`, `QuizKnowledgeCheckModal`, and `CertificateModal`.

---

### Phase 3: Client Intake & Prior Authorization
- [x] **3.1 Spec 05: Client Intake & Clinical Documents**
  - [x] Migration `006_clients_and_client_documents.sql`:
    - `clients` table (`service_address`, `emergency_contacts`, `care_needs`, `payer_details`).
    - `client_documents` table (Assessments, 485 Physician Orders, Consents).
  - [x] Add Zod schemas: `CreateClientIntakeSchema`, `UpdateClientStatusSchema`.
  - [x] API routes:
    - `POST /api/v1/clients` (create intake).
    - `GET /api/v1/clients` (multi-tenant filtered roster).
    - `GET /api/v1/clients/:id` (detailed profile with PHI access audit).
    - `PATCH /api/v1/clients/:id/status` (lifecycle transitions).
    - `POST /api/v1/clients/:id/documents` (presigned doc upload).
  - [x] Frontend components: `ClientRosterTable`, `ClientIntakeWizard`, `ClientProfileModal`, and `ClientOperationsPage`.
- [x] **3.2 Spec 06: Client Prior Authorization & Utilization**
  - [x] Migration `007_client_authorizations.sql`:
    - `client_authorizations` table (`total_units_authorized`, `total_units_used`, weekly caps).
    - `authorization_unit_logs` table (immutable unit deduction audit trail).
  - [x] Add Zod schemas: `CreateAuthorizationSchema`, `UpdateUnitsUsedSchema`.
  - [x] API routes:
    - `POST /api/v1/clients/:id/authorizations`.
    - `GET /api/v1/clients/:id/authorizations`.
    - `PATCH /api/v1/authorizations/:id/units` (burn-down update & auto exhaustion).
    - `GET /api/v1/authorizations/:id/burndown` (at-risk & percentage analytics).
  - [x] Authorization expiration cron: hourly/daily check for 30-day alerts and `expiring_soon` / `expired` updates.
  - [x] Frontend components: `ClientAuthorizationsList`, `AuthorizationBurnDownCard`, and `CreateAuthorizationModal`.

---

### Phase 4: Automation, Signatures & Admin Command Center
- [x] **4.1 Spec 08: Notifications & Automation Engine**
  - [x] Migration `008_notifications_engine.sql`:
    - `notification_queue` outbox table and `in_app_notifications` inbox table.
  - [x] Add Zod schemas: `QueueNotificationSchema`, `UpdatePreferencesSchema`.
  - [x] Core dispatcher service:
    - `node-cron` outbox processor (every minute).
    - Exponential backoff retry logic (up to 3 attempts).
    - Amazon SES email integration and Twilio SMS client (with local mock fallback).
    - PHI-stripping filter on all SMS payloads.
  - [x] API routes: `GET /inbox`, `PATCH /:id/read`, `POST /dispatch`.
  - [x] Frontend components: `NotificationBell` with unread badge, `NotificationDropdown`, and `NotificationCenter`.
- [x] **4.2 Spec 09: E-Signature Workflows**
  - [x] Migration `009_signature_envelopes.sql`:
    - `signature_envelopes` table with SHA-256 digest, IP address, and status.
  - [x] Add Zod schemas: `CreateEnvelopeSchema`, `SubmitSignatureSchema`.
  - [x] API routes:
    - `POST /api/v1/esign/envelopes` (create envelope).
    - `POST /api/v1/esign/envelopes/:id/sign` (capture signature, hash PDF, upload to S3).
    - `POST /api/v1/esign/webhooks/provider` (DocuSign/SignWell webhook).
    - `GET /api/v1/esign/envelopes/:id` (status check).
  - [x] Frontend components: `SignatureContainerModal`, `SignatureCanvasPad`, and `ESIGNConsentCheckbox`.
- [x] **4.3 Spec 07: Admin Command Center & State Reporting**
  - [x] Migration `010_admin_kpi_view.sql`:
    - View `admin_kpi_metrics` joining organizations, caregivers, clients, documents, and authorizations.
  - [x] API routes:
    - `GET /api/v1/admin/kpis` (multi-state or state-filtered metrics).
    - `GET /api/v1/admin/export/audit-packet` (streaming CSV/PDF state survey report).
  - [x] App / Portal:
    - State toggle (All States / GA / IN) restricted by user role.
    - `AdminCommandCenter`, `KPICardGrid`, `UrgentActionQueue`, and `AuditPacketExporter`.
