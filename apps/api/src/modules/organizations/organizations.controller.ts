import type { Request, Response, NextFunction } from 'express';
import { organizationsService } from './organizations.service.js';
import { AppError } from '../../lib/errors.js';

export async function getOrganizationByDomainController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const domain = req.query.domain as string;

    if (!domain || domain.trim() === '') {
      throw AppError.badRequest('domain query parameter is required');
    }

    const cleanDomain = domain.trim().toLowerCase();
    const org = await organizationsService.getOrganizationByDomain(cleanDomain);

    if (!org) {
      throw AppError.notFound('Organization not found for domain');
    }

    res.status(200).json({
      success: true,
      data: org,
    });
  } catch (error) {
    next(error);
  }
}
