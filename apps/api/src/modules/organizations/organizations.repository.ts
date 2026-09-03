import { db } from '../../db/index.js';
import type { Organization } from '@crystal/types';

export class OrganizationsRepository {
  /**
   * Find an active organization by primary domain or subdomains array containing domain
   */
  async findByDomain(domain: string): Promise<Organization | null> {
    const query = `
      SELECT 
        id,
        name,
        state_code,
        primary_domain,
        subdomains,
        license_number,
        contact_phone,
        contact_email,
        emergency_phone,
        office_address,
        office_hours,
        branding_theme,
        enabled_services,
        is_active,
        created_at,
        updated_at
      FROM public.organizations
      WHERE is_active = true 
        AND (primary_domain = $1 OR $1 = ANY(subdomains) OR $1 LIKE '%' || primary_domain)
      LIMIT 1;
    `;

    const result = await db.query(query, [domain]);
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as Organization;
  }
}

export const organizationsRepository = new OrganizationsRepository();
