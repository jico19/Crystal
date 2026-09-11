import type { Request, Response, NextFunction } from 'express';
import { VideoProgressUpdateSchema, QuizSubmissionSchema } from '@crystal/validation';
import { trainingService } from './training.service.js';
import { AppError } from '../../lib/errors.js';

export class TrainingController {
  async listModules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const caregiverId = (req.query.caregiverId as string) || req.user?.id;
      if (!caregiverId) {
        throw AppError.badRequest('Missing caregiver ID context');
      }

      const orgId = req.user?.org_id;
      const modules = await trainingService.listModulesWithProgress(caregiverId, orgId);
      res.json({
        success: true,
        data: { modules },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateVideoProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = VideoProgressUpdateSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw AppError.badRequest('Invalid video progress payload', parseResult.error.flatten().fieldErrors);
      }

      const caregiverId = (req.body.caregiver_id as string) || req.user?.id;
      if (!caregiverId) {
        throw AppError.badRequest('Missing caregiver ID');
      }

      const progress = await trainingService.updateVideoProgress(caregiverId, parseResult.data);
      res.json({
        success: true,
        data: { progress },
      });
    } catch (err) {
      next(err);
    }
  }

  async submitQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = QuizSubmissionSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw AppError.badRequest('Invalid quiz submission format', parseResult.error.flatten().fieldErrors);
      }

      const caregiverId = (req.body.caregiver_id as string) || req.user?.id;
      if (!caregiverId) {
        throw AppError.badRequest('Missing caregiver ID');
      }

      const result = await trainingService.submitQuiz(caregiverId, parseResult.data);
      res.json({
        success: true,
        data: result,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('locked') || msg.includes('Anti-skip')) {
        next(AppError.forbidden(msg));
      } else if (msg.includes('not found')) {
        next(AppError.notFound(msg));
      } else {
        next(AppError.badRequest(msg));
      }
    }
  }

  async getCertificate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const id = String(req.params.id);
    try {
      const certificate = await trainingService.getCertificate(id);
      res.json({
        success: true,
        data: { certificate },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      next(AppError.notFound(msg));
    }
  }
}

export const trainingController = new TrainingController();
