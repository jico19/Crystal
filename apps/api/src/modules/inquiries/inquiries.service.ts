import { inquiriesRepository, type InsertInquiryParams } from './inquiries.repository.js';
import { sendLeadNotificationEmail } from '../../lib/ses-mailer.js';
import type { CreatePublicInquiryInput } from '@crystal/validation';

export interface SubmitInquiryResult {
  isHoneypot: boolean;
  inquiryId: string;
}

export class InquiriesService {
  async submitInquiry(
    input: CreatePublicInquiryInput,
    ipAddress?: string
  ): Promise<SubmitInquiryResult> {
    // 1. Honeypot Anti-Spam Check: if honeypot is populated by automated bot, drop silently
    if (input.honeypot && input.honeypot.trim().length > 0) {
      console.warn(`[Honeypot Triggered] Silent bot drop for submission from ${input.email}`);
      return { isHoneypot: true, inquiryId: 'noop' };
    }

    const { honeypot: _hp, ...payload } = input;
    const insertParams: InsertInquiryParams = {
      ...payload,
      ip_address: ipAddress,
    };

    // 2. Insert record into database
    const inquiryId = await inquiriesRepository.createInquiry(insertParams);

    // 3. Fire-and-forget non-blocking SES email notification
    sendLeadNotificationEmail({
      inquiryId,
      orgId: payload.org_id,
      stateCode: payload.state_code,
      fullName: payload.full_name,
      email: payload.email,
      phone: payload.phone,
      inquiryType: payload.inquiry_type,
      message: payload.message,
    }).catch((mailErr) => {
      console.error('[SES Lead Mailer Non-Blocking Error]', mailErr);
    });

    return { isHoneypot: false, inquiryId };
  }
}

export const inquiriesService = new InquiriesService();
