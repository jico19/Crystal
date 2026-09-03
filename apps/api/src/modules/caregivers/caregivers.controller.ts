import type { Request, Response, NextFunction } from 'express';
import {
  CreateDraftApplicationSchema,
  SaveDraftStepSchema,
  LegalDisclosuresStepSchema,
} from '@crystal/validation';
import { caregiversService, ServiceError } from './caregivers.service.js';

export async function createApplicationDraftController(
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

    // 2. Execute service logic (sanitizes SSN, upserts draft profile)
    const result = await caregiversService.createOrUpdateDraftProfile(
      req.user.id,
      validation.data
    );

    res.status(201).json({
      success: true,
      data: {
        profileId: result.profileId,
        applicationStatus: result.applicationStatus,
        applicationStep: result.applicationStep,
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
