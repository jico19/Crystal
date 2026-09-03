// ============================================================================
// SES Mailer — Transactional Notifications
// ============================================================================

export interface LeadNotificationPayload {
  inquiryId: string;
  orgId: string;
  stateCode: string;
  fullName: string;
  email: string;
  phone: string;
  inquiryType: string;
  message: string;
}

export async function sendLeadNotificationEmail(payload: LeadNotificationPayload): Promise<void> {
  const sesFromEmail = process.env.SES_FROM_EMAIL || 'notifications@crystalhomecare.com';

  console.log(`[SES Lead Mailer] Dispatching lead notification email:`, {
    from: sesFromEmail,
    inquiryId: payload.inquiryId,
    stateCode: payload.stateCode,
    fullName: payload.fullName,
    email: payload.email,
  });
}

export interface ApplicationSubmittedEmailPayload {
  applicantEmail: string;
  applicantName: string;
  stateCode: string;
  orgId: string;
}

export async function sendApplicationSubmittedEmails(payload: ApplicationSubmittedEmailPayload): Promise<void> {
  const sesFromEmail = process.env.SES_FROM_EMAIL || 'recruiting@crystalhomecare.com';

  console.log(`[SES Recruiting Mailer] Dispatching application submitted confirmation:`, {
    from: sesFromEmail,
    to: payload.applicantEmail,
    applicantName: payload.applicantName,
    stateCode: payload.stateCode,
    orgId: payload.orgId,
  });
}
