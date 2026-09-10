export interface SendSmsParams {
  to: string;
  from?: string;
  body: string;
}

export interface SendSmsResult {
  messageId: string;
  provider: 'local' | 'twilio';
  timestamp: string;
  sanitizedBody: string;
}

export interface SmsProvider {
  name: 'local' | 'twilio';
  sendSms(params: SendSmsParams): Promise<SendSmsResult>;
}

/**
 * HIPAA Compliance: Strip explicit PHI / clinical diagnosis / Medicaid IDs from SMS payloads
 */
export function stripPhiFromSms(text: string): string {
  let sanitized = text;

  // Mask SSNs
  sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');

  // Mask Medicaid / Recipient numbers (e.g. GA-12345678, MED-123456)
  sanitized = sanitized.replace(/\b(GA|IN|MED|REC)[-_]?[A-Z0-9]{6,12}\b/gi, '[REDACTED_ID]');

  // Mask medical diagnoses
  const sensitiveClinicalTerms = [
    'dementia', 'alzheimer', 'cancer', 'hiv', 'depression', 'bipolar',
    'schizophrenia', 'parkinson', 'stroke', 'diabetes', 'incontinence'
  ];
  for (const term of sensitiveClinicalTerms) {
    const reg = new RegExp(`\\b${term}\\b`, 'gi');
    sanitized = sanitized.replace(reg, '[CLINICAL_INFO]');
  }

  return sanitized;
}
