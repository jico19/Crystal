import type { Request, Response, NextFunction } from 'express';
import { organizationsService } from './organizations.service.js';

export async function getOrganizationByDomainController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const domain = req.query.domain as string;

    if (!domain || domain.trim() === '') {
      res.status(400).json({
        success: false,
        error: 'domain query parameter is required',
      });
      return;
    }

    const cleanDomain = domain.trim().toLowerCase();
    const org = await organizationsService.getOrganizationByDomain(cleanDomain);

    if (!org) {
      res.status(404).json({
        success: false,
        error: 'Organization not found for domain',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: org,
    });
  } catch (error) {
    next(error);
  }
}
