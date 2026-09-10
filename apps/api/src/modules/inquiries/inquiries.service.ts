import { inquiriesRepository, type InsertInquiryParams } from './inquiries.repository.js';
import { getEmailProvider } from '../../integrations/email/index.js';
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

    // 3. Fire-and-forget non-blocking email notification
    getEmailProvider().sendEmail({
      to: process.env.SES_FROM_EMAIL || 'notifications@crystalhomecare.com',
      subject: `New Lead: ${payload.full_name} (${payload.inquiry_type})`,
      html: `<p>New inquiry from ${payload.full_name} (${payload.email}, ${payload.phone}):</p><p>${payload.message}</p>`,
      text: `New inquiry from ${payload.full_name} (${payload.email}, ${payload.phone}):\n\n${payload.message}`,
    }).catch((mailErr) => {
      console.error('[Email Notification Error]', mailErr);
    });

    return { isHoneypot: false, inquiryId };
  }
}

export const inquiriesService = new InquiriesService();
