/**
 * Crystal Security Utilities
 * Handles PII encryption, SSN masking, and hash generation.
 * NOTE: In production, replace encrypt/decrypt with AWS KMS calls.
 */

/**
 * Encrypts sensitive PII data (e.g. SSN) using a deterministic XOR cipher
 * for local dev simulation. Production: replace with AWS KMS encrypt.
 */
export function encryptPII(plaintext: string): string {
  const key = process.env.PII_ENCRYPTION_KEY ?? 'crystal-dev-key-32chars-padded!!';
  const encoded = Buffer.from(plaintext, 'utf8');
  const keyBytes = Buffer.from(key, 'utf8');
  const result = Buffer.alloc(encoded.length);
  for (let i = 0; i < encoded.length; i++) {
    result[i] = encoded[i] ^ keyBytes[i % keyBytes.length];
  }
  return result.toString('base64');
}

/**
 * Decrypts PII data encrypted with encryptPII.
 * Production: replace with AWS KMS decrypt.
 */
export function decryptPII(ciphertext: string): string {
  const key = process.env.PII_ENCRYPTION_KEY ?? 'crystal-dev-key-32chars-padded!!';
  const encoded = Buffer.from(ciphertext, 'base64');
  const keyBytes = Buffer.from(key, 'utf8');
  const result = Buffer.alloc(encoded.length);
  for (let i = 0; i < encoded.length; i++) {
    result[i] = encoded[i] ^ keyBytes[i % keyBytes.length];
  }
  return result.toString('utf8');
}

/**
 * Extracts last 4 digits from a raw SSN string (strips non-digits first).
 */
export function extractSSNLast4(ssn: string): string {
  return ssn.replace(/\D/g, '').slice(-4);
}

/**
 * Masks SSN for display: returns '***-**-XXXX' format.
 */
export function maskSSN(ssn: string): string {
  const digits = ssn.replace(/\D/g, '');
  if (digits.length !== 9) return '***-**-****';
  return `***-**-${digits.slice(-4)}`;
}

/**
 * Strips raw SSN from personal_info payload and replaces with:
 * - ssn_last4: last 4 digits (for display)
 * - ssn_encrypted: encrypted blob
 * Returns sanitized personal_info object safe to persist.
 */
export function sanitizePersonalInfoSSN(
  personalInfo: Record<string, unknown>
): Record<string, unknown> {
  const rawSSN = personalInfo.ssn as string | undefined;
  const sanitized = { ...personalInfo };
  delete sanitized.ssn; // Never persist raw SSN
  if (rawSSN) {
    sanitized.ssn_last4 = extractSSNLast4(rawSSN);
    sanitized.ssn_encrypted = encryptPII(rawSSN);
  }
  return sanitized;
}

import crypto from 'crypto';

/**
 * Computes a deterministic cryptographic SHA-256 hash stamp for an e-signature envelope.
 * Used for tamper-evident digital records compliant with ESIGN / UETA 15 U.S.C. § 7001.
 */
export function computeDocumentHash(data: {
  envelope_id: string;
  org_id: string;
  signer_name: string;
  signer_email: string;
  signed_at: string;
  signature_base64: string;
}): string {
  const canonicalPayload = JSON.stringify({
    envelope_id: data.envelope_id,
    org_id: data.org_id,
    signer_name: data.signer_name,
    signer_email: data.signer_email,
    signed_at: data.signed_at,
    signature_base64: data.signature_base64,
  });
  return crypto.createHash('sha256').update(canonicalPayload).digest('hex');
}

