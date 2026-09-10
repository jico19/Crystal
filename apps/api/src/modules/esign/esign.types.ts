export type EnvelopeStatus = 'draft' | 'sent' | 'signed' | 'declined' | 'expired';

export interface SignatureEnvelope {
  id: string;
  org_id: string;
  title: string;
  document_type: string;
  related_entity_id?: string | null;
  recipient_email: string;
  recipient_name: string;
  status: EnvelopeStatus;
  signature_data_url?: string | null;
  full_legal_name?: string | null;
  consent_timestamp?: string | null;
  signer_ip_address?: string | null;
  tamper_sha256?: string | null;
  signed_document_storage_path?: string | null;
  external_provider_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEnvelopeDTO {
  org_id: string;
  title: string;
  document_type: string;
  related_entity_id?: string | null;
  recipient_email: string;
  recipient_name: string;
}

export interface SignEnvelopeDTO {
  signature_data_url: string;
  full_legal_name: string;
  signer_ip_address?: string;
}
