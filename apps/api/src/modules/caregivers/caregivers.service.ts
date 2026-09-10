import jwt from 'jsonwebtoken';
import {
  caregiversRepository,
  type CaregiverDraftResult,
  type CaregiverSubmitResult,
} from './caregivers.repository.js';
import {
  CompleteCaregiverApplicationSchema,
  type CreateDraftApplicationInput,
  type SaveDraftStepInput,
  type LegalDisclosuresStepInput,
} from '@crystal/validation';
import { getEmailProvider } from '../../integrations/email/index.js';

export class ServiceError extends Error {
  status: number;
  fieldErrors?: Record<string, string[]>;
  constructor(message: string, status: number, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.name = 'ServiceError';
  }
}

export class CaregiversService {
  /**
   * Creates or updates a caregiver's draft application profile with SSN sanitization (Step 1)
   */
  async createOrUpdateDraftProfile(
    userId: string | undefined,
    input: CreateDraftApplicationInput
  ): Promise<CaregiverDraftResult> {
    const { ssn, ...restOfPersonalInfo } = input.personal_info;

    // Securely extract the last 4 digits of SSN
    const cleanDigits = ssn.replace(/\D/g, '');
    const ssn_last4 = cleanDigits.slice(-4);

    // Build sanitized personal_info payload (raw SSN is completely removed)
    const sanitizedPersonalInfo: Record<string, unknown> = {
      ...restOfPersonalInfo,
      ssn_last4,
    };

    const draftResult = await caregiversRepository.upsertDraftProfile({
      userId,
      email: input.personal_info.email,
      orgId: input.org_id,
      stateCode: input.state_code,
      sanitizedPersonalInfo,
    });

    const jwtSecret = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-12345';
    const token = jwt.sign(
      {
        sub: draftResult.userId,
        role: 'caregiver',
        email: input.personal_info.email,
        org_id: input.org_id,
        app_metadata: {
          role: 'caregiver',
          org_id: input.org_id,
        },
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return {
      ...draftResult,
      token,
    };
  }

  /**
   * Incrementally saves draft step progress for Step 2, 3, or 4
   */
  async updateDraftStep(
    userId: string,
    input: SaveDraftStepInput
  ): Promise<CaregiverDraftResult> {
    // 1. Check existing profile
    const existing = await caregiversRepository.findProfileByUserId(userId);
    if (!existing) {
      throw new ServiceError('Application draft not found. Complete Step 1 first.', 404);
    }

    if (existing.application_status !== 'draft') {
      throw new ServiceError(
        'Application has already been submitted and cannot be modified',
        409
      );
    }

    // 2. Map fields based on step
    let fieldsToUpdate = {};
    if (input.step === 2) {
      fieldsToUpdate = {
        positions_applied: input.data.positions_applied,
        availability: input.data.availability,
      };
    } else if (input.step === 3) {
      fieldsToUpdate = {
        experience_history: input.data.experience_history,
        references: input.data.references,
      };
    } else if (input.step === 4) {
      fieldsToUpdate = {
        professional_licenses: input.data.professional_licenses,
      };
    }

    return await caregiversRepository.updateStepData(userId, input.step, fieldsToUpdate);
  }

  /**
   * Finalizes and submits the complete caregiver application (Step 5)
   */
  async finalizeApplication(
    userId: string,
    legalDisclosures: LegalDisclosuresStepInput
  ): Promise<CaregiverSubmitResult> {
    const existing = await caregiversRepository.findProfileByUserId(userId);
    if (!existing) {
      throw new ServiceError('Application draft not found', 404);
    }

    if (existing.application_status !== 'draft') {
      throw new ServiceError('Application has already been submitted', 409);
    }

    // Validate the assembled profile for full completeness across all 5 steps
    const assembledProfile = {
      personal_info: existing.personal_info,
      positions_applied: existing.positions_applied,
      availability: existing.availability,
      experience_history: existing.experience_history,
      references: existing.references,
      professional_licenses: existing.professional_licenses,
      legal_disclosures: legalDisclosures,
    };

    const wholeProfileValidation = CompleteCaregiverApplicationSchema.safeParse(assembledProfile);
    if (!wholeProfileValidation.success) {
      throw new ServiceError(
        'Validation failed',
        422,
        wholeProfileValidation.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    // Persist final submission status in DB
    const submitResult = await caregiversRepository.submitProfile(
      userId,
      legalDisclosures as Record<string, unknown>
    );

    // Non-blocking transactional email notification
    const personalInfo = existing.personal_info as { email?: string; first_name?: string; last_name?: string };
    const applicantEmail = personalInfo?.email || 'applicant@example.com';
    const applicantName = `${personalInfo?.first_name || ''} ${personalInfo?.last_name || ''}`.trim() || 'Caregiver Candidate';

    getEmailProvider().sendEmail({
      to: applicantEmail,
      subject: 'Caregiver Application Received - Crystal Home Care',
      html: `<p>Dear ${applicantName},</p><p>Your caregiver application has been submitted and is under clinical review.</p>`,
      text: `Dear ${applicantName},\n\nYour caregiver application has been submitted and is under clinical review.`,
    }).catch((err: unknown) => {
      console.error('[Email Notification Error] Failed to send application submitted email:', err);
    });

    return submitResult;
  }
}

export const caregiversService = new CaregiversService();
