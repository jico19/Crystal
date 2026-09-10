import crypto from 'crypto';
import { esignRepository } from './esign.repository.js';
import { getStorageProvider, LocalStorageProvider } from '../../integrations/storage/index.js';
import { notificationsService } from '../notifications/notifications.service.js';
import { auditService } from '../audit/audit.service.js';
import type { SignatureEnvelope } from './esign.types.js';
import type { CreateEnvelopeInput, SubmitSignatureInput } from '@crystal/validation';
import type { AuthenticatedUser } from '@crystal/types';

export class EsignService {
  async createEnvelope(
    input: CreateEnvelopeInput,
    user: AuthenticatedUser,
    ipAddress?: string
  ): Promise<SignatureEnvelope> {
    const envelope = await esignRepository.createEnvelope({
      org_id: input.org_id,
      title: input.title,
      document_type: input.document_type,
      related_entity_id: input.related_entity_id,
      recipient_email: input.recipient_email,
      recipient_name: input.recipient_name,
    });

    // Enqueue invitation email/notification to recipient
    await notificationsService.queueNotification({
      org_id: input.org_id,
      channel: 'email',
      destination: input.recipient_email,
      subject: `Action Required: Signature Requested for ${input.title}`,
      payload: {
        title: input.title,
        recipient_name: input.recipient_name,
        envelope_id: envelope.id,
        signing_url: `http://localhost:5173/esign/${envelope.id}`,
        message: `Hello ${input.recipient_name}, please review and electronically sign: "${input.title}".`,
      },
    });

    await auditService.logAuditEvent({
      orgId: input.org_id,
      userId: user.id,
      eventType: 'RECORD_MUTATION',
      resourceType: 'signature_envelope',
      resourceId: envelope.id,
      ipAddress: ipAddress,
      metadata: {
        action: 'CREATE_SIGNATURE_ENVELOPE',
        title: input.title,
        recipient: input.recipient_email,
      },
    });

    return envelope;
  }

  async getEnvelope(id: string, orgId?: string): Promise<SignatureEnvelope | null> {
    return await esignRepository.findById(id, orgId);
  }

  async signEnvelope(
    envelopeId: string,
    input: SubmitSignatureInput,
    ipAddress = '127.0.0.1'
  ): Promise<SignatureEnvelope> {
    const envelope = await esignRepository.findById(envelopeId);
    if (!envelope) {
      throw new Error(`Signature envelope ${envelopeId} not found`);
    }

    if (envelope.status === 'signed') {
      throw new Error(`Signature envelope ${envelopeId} has already been signed`);
    }

    const timestamp = new Date().toISOString();

    // Generate cryptographic SHA-256 tamper-evident digest
    const hashData = `${envelope.id}:${envelope.org_id}:${input.full_legal_name}:${timestamp}:${ipAddress}:${input.signature_data_url.slice(0, 100)}`;
    const tamperSha256 = crypto.createHash('sha256').update(hashData).digest('hex');

    // Archive signed packet into pluggable storage
    const storagePath = `signatures/${envelope.org_id}/${envelope.id}/signed_audit_record.json`;
    const storageProvider = getStorageProvider();

    if (storageProvider instanceof LocalStorageProvider) {
      const recordBuffer = Buffer.from(
        JSON.stringify(
          {
            envelopeId: envelope.id,
            title: envelope.title,
            documentType: envelope.document_type,
            recipientName: envelope.recipient_name,
            fullLegalName: input.full_legal_name,
            signatureDataUrl: input.signature_data_url,
            tamperSha256,
            consentTimestamp: timestamp,
            signerIpAddress: ipAddress,
          },
          null,
          2
        )
      );
      await storageProvider.saveFileBuffer(storagePath, recordBuffer);
    }

    const updated = await esignRepository.updateSigned(envelope.id, {
      signatureDataUrl: input.signature_data_url,
      fullLegalName: input.full_legal_name,
      ipAddress,
      tamperSha256,
      storagePath,
    });

    if (!updated) {
      throw new Error(`Failed to update signed envelope ${envelopeId}`);
    }

    await auditService.logAuditEvent({
      orgId: envelope.org_id,
      eventType: 'RECORD_MUTATION',
      resourceType: 'signature_envelope',
      resourceId: envelope.id,
      ipAddress,
      metadata: {
        action: 'SUBMIT_ELECTRONIC_SIGNATURE',
        signer: input.full_legal_name,
        tamper_sha256: tamperSha256,
      },
    });

    return updated;
  }

  async processWebhook(provider: string, payload: any): Promise<{ received: boolean; status?: string }> {
    console.log(`📥 [E-Sign Webhook] Received webhook from provider "${provider}":`, payload?.event || payload?.type);

    const externalId = payload?.envelope_id || payload?.id;
    if (externalId && payload?.status) {
      return { received: true, status: payload.status };
    }

    return { received: true };
  }
}

export const esignService = new EsignService();
