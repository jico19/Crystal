import { db } from '../../db/index.js';
import type { SignatureEnvelope, CreateEnvelopeDTO, EnvelopeStatus } from './esign.types.js';

export class EsignRepository {
  async createEnvelope(dto: CreateEnvelopeDTO): Promise<SignatureEnvelope> {
    const query = `
      INSERT INTO public.signature_envelopes (
        org_id, title, document_type, related_entity_id,
        recipient_email, recipient_name, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'sent')
      RETURNING *;
    `;
    const values = [
      dto.org_id,
      dto.title,
      dto.document_type,
      dto.related_entity_id || null,
      dto.recipient_email,
      dto.recipient_name,
    ];

    const res = await db.query(query, values);
    return res.rows[0];
  }

  async findById(id: string, orgId?: string): Promise<SignatureEnvelope | null> {
    let query = `SELECT * FROM public.signature_envelopes WHERE id = $1`;
    const values: any[] = [id];

    if (orgId) {
      query += ` AND org_id = $2`;
      values.push(orgId);
    }

    const res = await db.query(query, values);
    return res.rows[0] || null;
  }

  async findByEntity(entityId: string): Promise<SignatureEnvelope[]> {
    const query = `
      SELECT * FROM public.signature_envelopes
      WHERE related_entity_id = $1
      ORDER BY created_at DESC;
    `;
    const res = await db.query(query, [entityId]);
    return res.rows;
  }

  async updateSigned(
    id: string,
    data: {
      signatureDataUrl: string;
      fullLegalName: string;
      ipAddress?: string;
      tamperSha256: string;
      storagePath: string;
    }
  ): Promise<SignatureEnvelope | null> {
    const query = `
      UPDATE public.signature_envelopes
      SET status = 'signed',
          signature_data_url = $1,
          full_legal_name = $2,
          signer_ip_address = $3,
          tamper_sha256 = $4,
          signed_document_storage_path = $5,
          consent_timestamp = NOW(),
          updated_at = NOW()
      WHERE id = $6
      RETURNING *;
    `;
    const res = await db.query(query, [
      data.signatureDataUrl,
      data.fullLegalName,
      data.ipAddress || '127.0.0.1',
      data.tamperSha256,
      data.storagePath,
      id,
    ]);
    return res.rows[0] || null;
  }

  async updateExternalStatus(
    id: string,
    status: EnvelopeStatus,
    externalId?: string
  ): Promise<SignatureEnvelope | null> {
    const query = `
      UPDATE public.signature_envelopes
      SET status = $1,
          external_provider_id = COALESCE($2, external_provider_id),
          updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;
    const res = await db.query(query, [status, externalId || null, id]);
    return res.rows[0] || null;
  }
}

export const esignRepository = new EsignRepository();
