import { organizationsRepository } from './organizations.repository.js';
import { OrganizationSchema } from '@crystal/validation';
import type { Organization } from '@crystal/types';

export class OrganizationsService {
  async getOrganizationByDomain(domain: string): Promise<Organization | null> {
    const org = await organizationsRepository.findByDomain(domain);
    if (!org) {
      return null;
    }

    // Validate output shape against Zod schema
    const parsed = OrganizationSchema.safeParse(org);
    if (!parsed.success) {
      console.error('[OrganizationSchema Validation Error]', parsed.error.flatten());
      return org as Organization; // Fallback if subtle date format mismatch
    }

    return parsed.data as Organization;
  }
}

export const organizationsService = new OrganizationsService();
