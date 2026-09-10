import { db } from '../../db/index.js';
import type { ClientAuthorization, AuthorizationStatus } from '@crystal/types';
import type {
  CreateAuthorizationDTO,
  UpdateUnitsDTO,
  AuthorizationFilterOptions,
  AuthorizationWithClient,
} from './authorizations.types.js';

export class AuthorizationsRepository {
  async create(dto: CreateAuthorizationDTO): Promise<ClientAuthorization> {
    const query = `
      INSERT INTO public.client_authorizations (
        client_id, org_id, auth_number, payer_id, service_code,
        start_date, end_date, total_units_authorized, total_units_used,
        weekly_unit_cap, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, 'active', $10)
      RETURNING *;
    `;
    const values = [
      dto.client_id,
      dto.org_id,
      dto.auth_number,
      dto.payer_id,
      dto.service_code || 'T1019',
      dto.start_date,
      dto.end_date,
      dto.total_units_authorized,
      dto.weekly_unit_cap || null,
      dto.notes || null,
    ];

    const res = await db.query(query, values);
    return res.rows[0];
  }

  async findById(id: string, orgId?: string): Promise<AuthorizationWithClient | null> {
    let query = `
      SELECT
        ca.*,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.medicaid_id
      FROM public.client_authorizations ca
      JOIN public.clients c ON c.id = ca.client_id
      WHERE ca.id = $1
    `;
    const values: any[] = [id];

    if (orgId) {
      query += ` AND ca.org_id = $2`;
      values.push(orgId);
    }

    const res = await db.query(query, values);
    return res.rows[0] || null;
  }

  async findByClientId(clientId: string, orgId: string): Promise<ClientAuthorization[]> {
    const query = `
      SELECT * FROM public.client_authorizations
      WHERE client_id = $1 AND org_id = $2
      ORDER BY end_date DESC;
    `;
    const res = await db.query(query, [clientId, orgId]);
    return res.rows;
  }

  async findMany(
    options: AuthorizationFilterOptions
  ): Promise<{ authorizations: AuthorizationWithClient[]; total: number }> {
    const conditions: string[] = ['ca.org_id = $1'];
    const values: any[] = [options.org_id];
    let paramIdx = 2;

    if (options.client_id) {
      conditions.push(`ca.client_id = $${paramIdx++}`);
      values.push(options.client_id);
    }

    if (options.status) {
      conditions.push(`ca.status = $${paramIdx++}`);
      values.push(options.status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await db.query(
      `SELECT COUNT(*)::int as count FROM public.client_authorizations ca ${whereClause};`,
      values
    );
    const total = countRes.rows[0]?.count || 0;

    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const query = `
      SELECT
        ca.*,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        c.medicaid_id
      FROM public.client_authorizations ca
      JOIN public.clients c ON c.id = ca.client_id
      ${whereClause}
      ORDER BY ca.end_date ASC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++};
    `;
    values.push(limit, offset);

    const dataRes = await db.query(query, values);
    return { authorizations: dataRes.rows, total };
  }

  async addUnitsUsed(
    id: string,
    delta: number,
    newStatus?: AuthorizationStatus
  ): Promise<ClientAuthorization | null> {
    let query: string;
    let values: any[];

    if (newStatus) {
      query = `
        UPDATE public.client_authorizations
        SET total_units_used = total_units_used + $1,
            status = $2,
            updated_at = NOW()
        WHERE id = $3
        RETURNING *;
      `;
      values = [delta, newStatus, id];
    } else {
      query = `
        UPDATE public.client_authorizations
        SET total_units_used = total_units_used + $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *;
      `;
      values = [delta, id];
    }

    const res = await db.query(query, values);
    return res.rows[0] || null;
  }

  async logUnitUsage(dto: UpdateUnitsDTO): Promise<void> {
    const query = `
      INSERT INTO public.authorization_unit_logs (
        authorization_id, units_used_delta, service_date, notes, logged_by
      ) VALUES ($1, $2, $3, $4, $5);
    `;
    await db.query(query, [
      dto.authorization_id,
      dto.units_used_delta,
      dto.service_date || new Date().toISOString().split('T')[0],
      dto.notes || null,
      dto.logged_by || null,
    ]);
  }

  async updateStatusesByDates(): Promise<{ expiredCount: number; expiringSoonCount: number }> {
    // 1. Mark expired if end_date < CURRENT_DATE
    const expiredRes = await db.query(`
      UPDATE public.client_authorizations
      SET status = 'expired', updated_at = NOW()
      WHERE end_date < CURRENT_DATE AND status NOT IN ('expired', 'exhausted');
    `);

    // 2. Mark expiring_soon if within 30 days
    const expiringSoonRes = await db.query(`
      UPDATE public.client_authorizations
      SET status = 'expiring_soon', updated_at = NOW()
      WHERE end_date >= CURRENT_DATE
        AND end_date <= (CURRENT_DATE + INTERVAL '30 days')
        AND status = 'active';
    `);

    return {
      expiredCount: expiredRes.rowCount || 0,
      expiringSoonCount: expiringSoonRes.rowCount || 0,
    };
  }
}

export const authorizationsRepository = new AuthorizationsRepository();
