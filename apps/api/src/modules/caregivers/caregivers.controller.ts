import type { Request, Response, NextFunction } from 'express';
import {
  CreateDraftApplicationSchema,
  SaveDraftStepSchema,
  LegalDisclosuresStepSchema,
} from '@crystal/validation';
import { caregiversService, ServiceError } from './caregivers.service.js';
import { caregiversRepository } from './caregivers.repository.js';
import { db } from '../../db/index.js';

export async function createApplicationDraftController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Zod payload validation
    const validation = CreateDraftApplicationSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(422).json({
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    // 2. Execute service logic (sanitizes SSN, upserts draft profile, generates signed JWT)
    const result = await caregiversService.createOrUpdateDraftProfile(
      req.user?.id,
      validation.data
    );

    res.status(201).json({
      success: true,
      data: {
        profileId: result.profileId,
        userId: result.userId,
        applicationStatus: result.applicationStatus,
        applicationStep: result.applicationStep,
        token: result.token,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function saveDraftStepController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid Bearer authentication token',
      });
      return;
    }

    // 1. Zod payload validation with discriminated union on "step"
    const validation = SaveDraftStepSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(422).json({
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    // 2. Execute service logic
    const result = await caregiversService.updateDraftStep(req.user.id, validation.data);

    res.status(200).json({
      success: true,
      data: {
        profileId: result.profileId,
        applicationStep: result.applicationStep,
        updatedAt: result.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.status).json({
        success: false,
        error: error.message,
        fieldErrors: error.fieldErrors,
      });
      return;
    }
    next(error);
  }
}

export async function submitApplicationController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid Bearer authentication token',
      });
      return;
    }

    // 1. Zod payload validation for Step 5 legal disclosures
    const validation = LegalDisclosuresStepSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(422).json({
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    // 2. Execute service logic (validates whole profile, transitions status, dispatches SES)
    const result = await caregiversService.finalizeApplication(req.user.id, validation.data);

    res.status(200).json({
      success: true,
      data: {
        profileId: result.profileId,
        status: result.status,
        submittedAt: result.submittedAt,
      },
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.status).json({
        success: false,
        error: error.message,
        fieldErrors: error.fieldErrors,
      });
      return;
    }
    next(error);
  }
}

/**
 * GET /api/v1/caregivers/me
 * Retrieves current authenticated applicant's profile and live status
 */
export async function getCaregiverMeController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid Bearer authentication token',
      });
      return;
    }

    const profile = await caregiversRepository.findProfileByUserId(req.user.id);
    if (!profile) {
      // Fallback for staff, admins, or supervisors viewing caregiver portal
      const fallbackQuery = req.user.org_id
        ? await db.query(
            `SELECT id, user_id, org_id, state_code, application_status, application_step,
                    personal_info, positions_applied, created_at, updated_at
             FROM public.caregiver_profiles
             WHERE org_id = $1
             ORDER BY updated_at DESC LIMIT 1`,
            [req.user.org_id]
          )
        : await db.query(
            `SELECT id, user_id, org_id, state_code, application_status, application_step,
                    personal_info, positions_applied, created_at, updated_at
             FROM public.caregiver_profiles
             ORDER BY updated_at DESC LIMIT 1`
          );

      if (fallbackQuery.rows.length > 0) {
        res.status(200).json({
          success: true,
          data: fallbackQuery.rows[0],
        });
        return;
      }

      res.status(404).json({
        success: false,
        error: 'Caregiver application profile not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/caregivers
 * Lists caregiver applicants with optional org and status filter (Admin only)
 */
export async function listCaregiversController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orgId = req.user?.role === 'super_admin' ? (req.query.org_id as string) : req.user?.org_id;
    const status = req.query.status as string | undefined;

    let query = `
      SELECT id, user_id, org_id, state_code, application_status, application_step,
             personal_info, positions_applied, created_at, updated_at
      FROM public.caregiver_profiles
    `;
    const params: any[] = [];
    const where: string[] = [];

    if (orgId) {
      params.push(orgId);
      where.push(`org_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      where.push(`application_status = $${params.length}`);
    }

    if (where.length > 0) {
      query += ` WHERE ` + where.join(' AND ');
    }
    query += ` ORDER BY updated_at DESC LIMIT 50;`;

    const result = await db.query(query, params);
    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadEmploymentPacketController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stateCode = (req.query.state_code as string) || 'GA';
    const packetContent = `================================================================================
CRYSTAL MULTI-STATE HOME CARE PLATFORM
OFFICIAL EMPLOYMENT & CLINICAL ONBOARDING PACKET
State Jurisdiction: ${stateCode.toUpperCase()}
================================================================================

TABLE OF CONTENTS:
--------------------------------------------------------------------------------
Section 1: Direct Care Worker Application & Personal Demographics
Section 2: Criminal Background Check & Fingerprint Clearance Disclosure
Section 3: Tuberculosis (TB) Screening & Annual Health Questionnaire
Section 4: Direct Deposit Authorization & Banking Form
Section 5: Required Credential Verification & Document Checklist
Section 6: HIPAA Confidentiality, Client Privacy & Fraud Waste Abuse Policy

--------------------------------------------------------------------------------
SECTION 1: APPLICANT DEMOGRAPHICS & AVAILABILITY
--------------------------------------------------------------------------------
Full Legal Name: ______________________________________________________________
Physical Street Address: _______________________________________________________
City, State, Zip Code: ________________________________________________________
Primary Phone: ______________________  Email: __________________________________
Position Desired: [ ] CNA  [ ] HHA  [ ] PCA  [ ] RN  [ ] Homemaker
Schedule Desired: [ ] Full-Time  [ ] Part-Time  [ ] PRN / On-Call
Days Available:   [ ] Mon [ ] Tue [ ] Wed [ ] Thu [ ] Fri [ ] Sat [ ] Sun

--------------------------------------------------------------------------------
SECTION 2: STATE & FBI BACKGROUND CLEARANCE ATTESTATION
--------------------------------------------------------------------------------
I hereby authorize Crystal Home Care and its state operating agencies to conduct
comprehensive federal and state fingerprint background checks, sex offender
registry scans, and healthcare exclusion list checks (OIG/SAM).

Applicant Signature: _________________________________  Date: __________________

--------------------------------------------------------------------------------
SECTION 3: MANDATORY ONBOARDING CREDENTIAL CHECKLIST
--------------------------------------------------------------------------------
Please upload or submit certified copies of the following 11 items:
  [ ] 1. Government-Issued Photo ID / Driver's License
  [ ] 2. Social Security Card
  [ ] 3. CPR & First Aid Certification (BLS Healthcare Provider)
  [ ] 4. Active Professional License / Certification (CNA, HHA, RN)
  [ ] 5. TB Skin Test (PPD 2-Step, QuantiFERON Gold, or Chest X-Ray within 12 mo)
  [ ] 6. Physical Exam / Physician Health Statement
  [ ] 7. State & National Background Check Clearance
  [ ] 8. Valid Auto Insurance Policy Card (if transporting clients)
  [ ] 9. Clean Motor Vehicle Driving Record (MVR)
  [ ] 10. Direct Deposit Form & Voided Check
  [ ] 11. Form W-4 & Form I-9 Employment Eligibility Verification

--------------------------------------------------------------------------------
SECTION 4: DIRECT DEPOSIT AUTHORIZATION
--------------------------------------------------------------------------------
Financial Institution (Bank Name): ____________________________________________
Routing Transit Number (9 digits): _____________________________________________
Account Number: ___________________________________  [ ] Checking  [ ] Savings

--------------------------------------------------------------------------------
SECTION 5: CODE OF CONDUCT & HIPAA ACKNOWLEDGEMENT
--------------------------------------------------------------------------------
I certify that all statements made in this employment packet and associated
digital applications are true and complete. I understand that false or misleading
statements will result in immediate termination of employment.

Signature of Applicant: _______________________________ Date: _________________
Printed Name: ________________________________________

================================================================================
Submit online via Caregiver Portal: https://crystalhomecare.com/caregiver/portal
================================================================================`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="caregiver_employment_packet_${stateCode.toLowerCase()}.txt"`
    );
    res.send(packetContent);
  } catch (error) {
    next(error);
  }
}
