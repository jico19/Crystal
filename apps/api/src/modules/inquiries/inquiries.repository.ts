import { db } from '../../db/index.js';
import type { CreatePublicInquiryInput } from '@crystal/validation';

export interface InsertInquiryParams extends Omit<CreatePublicInquiryInput, 'honeypot'> {
  ip_address?: string;
}

export class InquiriesRepository {
  /**
   * Insert a new lead inquiry record into public.public_inquiries
   */
  async createInquiry(params: InsertInquiryParams): Promise<string> {
    const query = `
      INSERT INTO public.public_inquiries (
        org_id,
        state_code,
        full_name,
        email,
        phone,
        inquiry_type,
        message,
        source_url,
        ip_address,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new')
      RETURNING id;
    `;

    const values = [
      params.org_id,
      params.state_code,
      params.full_name,
      params.email,
      params.phone,
      params.inquiry_type,
      params.message,
      params.source_url,
      params.ip_address || '127.0.0.1',
    ];

    const result = await db.query(query, values);
    return result.rows[0].id as string;
  }
}

export const inquiriesRepository = new InquiriesRepository();
