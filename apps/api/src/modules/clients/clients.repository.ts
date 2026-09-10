import { db } from '../../db/index.js';
import type { ClientProfile, ClientDocument, ClientStatus } from '@crystal/types';
import type {
  CreateClientDTO,
  ClientFilterOptions,
  ClientWithSummary,
  AddClientDocumentDTO,
} from './clients.types.js';

export class ClientsRepository {
  async create(dto: CreateClientDTO): Promise<ClientProfile> {
    const query = `
      INSERT INTO public.clients (
        org_id, first_name, last_name, dob, gender, medicaid_id,
        status, service_address, emergency_contacts, care_needs, payer_details, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    const values = [
      dto.org_id,
      dto.first_name,
      dto.last_name,
      dto.dob,
      dto.gender,
      dto.medicaid_id || null,
      dto.status || 'intake_draft',
      JSON.stringify(dto.service_address || {}),
      JSON.stringify(dto.emergency_contacts || []),
      JSON.stringify(dto.care_needs || {}),
      JSON.stringify(dto.payer_details || {}),
      dto.notes || null,
    ];

    const res = await db.query(query, values);
    return res.rows[0];
  }

  async findById(id: string, orgId?: string): Promise<ClientProfile | null> {
    let query = `SELECT * FROM public.clients WHERE id = $1`;
    const values: any[] = [id];

    if (orgId) {
      query += ` AND org_id = $2`;
      values.push(orgId);
    }

    const res = await db.query(query, values);
    return res.rows[0] || null;
  }

  async findMany(options: ClientFilterOptions): Promise<{ clients: ClientWithSummary[]; total: number }> {
    const conditions: string[] = ['c.org_id = $1'];
    const values: any[] = [options.org_id];
    let paramIdx = 2;

    if (options.status) {
      conditions.push(`c.status = $${paramIdx++}`);
      values.push(options.status);
    }

    if (options.search) {
      conditions.push(`(c.first_name ILIKE $${paramIdx} OR c.last_name ILIKE $${paramIdx} OR c.medicaid_id ILIKE $${paramIdx})`);
      values.push(`%${options.search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT COUNT(*)::int as count FROM public.clients c ${whereClause};`,
      values
    );
    const total = countRes.rows[0]?.count || 0;

    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const dataQuery = `
      SELECT
        c.*,
        COALESCE(
          (SELECT COUNT(*)::int FROM public.client_authorizations ca
           WHERE ca.client_id = c.id AND ca.status = 'active'),
          0
        ) as active_authorizations_count,
        COALESCE(
          (SELECT COUNT(*)::int FROM public.client_documents cd
           WHERE cd.client_id = c.id),
          0
        ) as documents_count
      FROM public.clients c
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++};
    `;

    values.push(limit, offset);

    const dataRes = await db.query(dataQuery, values);
    return { clients: dataRes.rows, total };
  }

  async updateStatus(
    id: string,
    orgId: string,
    status: ClientStatus,
    notes?: string
  ): Promise<ClientProfile | null> {
    const query = `
      UPDATE public.clients
      SET status = $1,
          notes = COALESCE($2, notes),
          updated_at = NOW()
      WHERE id = $3 AND org_id = $4
      RETURNING *;
    `;
    const res = await db.query(query, [status, notes || null, id, orgId]);
    return res.rows[0] || null;
  }

  async addDocument(dto: AddClientDocumentDTO): Promise<ClientDocument> {
    const query = `
      INSERT INTO public.client_documents (
        client_id, org_id, category, storage_path, file_name, mime_type, expiration_date, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      dto.client_id,
      dto.org_id,
      dto.category,
      dto.storage_path,
      dto.file_name,
      dto.mime_type,
      dto.expiration_date || null,
      dto.uploaded_by || null,
    ];

    const res = await db.query(query, values);
    return res.rows[0];
  }

  async findDocumentsByClient(clientId: string, orgId: string): Promise<ClientDocument[]> {
    const res = await db.query(
      `SELECT * FROM public.client_documents
       WHERE client_id = $1 AND org_id = $2
       ORDER BY created_at DESC;`,
      [clientId, orgId]
    );
    return res.rows;
  }

  async findDocumentById(docId: string, orgId?: string): Promise<ClientDocument | null> {
    let query = `SELECT * FROM public.client_documents WHERE id = $1`;
    const values: any[] = [docId];
    if (orgId) {
      query += ` AND org_id = $2`;
      values.push(orgId);
    }
    const res = await db.query(query, values);
    return res.rows[0] || null;
  }

  async findSchedulesByClient(clientId: string): Promise<any[]> {
    const query = `
      SELECT * FROM public.client_schedules
      WHERE client_id = $1
      ORDER BY service_date ASC, start_time ASC;
    `;
    const res = await db.query(query, [clientId]);
    return res.rows;
  }

  async createSchedule(params: {
    clientId: string;
    orgId: string;
    caregiverId?: string;
    caregiverName?: string;
    serviceDate: string;
    startTime: string;
    endTime: string;
    serviceType?: string;
    notes?: string;
  }): Promise<any> {
    const query = `
      INSERT INTO public.client_schedules (
        client_id, org_id, caregiver_id, caregiver_name, service_date, start_time, end_time, service_type, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const values = [
      params.clientId,
      params.orgId,
      params.caregiverId || null,
      params.caregiverName || null,
      params.serviceDate,
      params.startTime,
      params.endTime,
      params.serviceType || 'Personal Support Services',
      params.notes || null,
    ];
    const res = await db.query(query, values);
    return res.rows[0];
  }
}

export const clientsRepository = new ClientsRepository();
