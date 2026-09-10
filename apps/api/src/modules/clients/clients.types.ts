import { ClientProfile, ClientDocument, ClientStatus, ClientDocCategory } from '@crystal/types';

export interface CreateClientDTO {
  org_id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  medicaid_id?: string | null;
  status?: ClientStatus;
  service_address: Record<string, unknown>;
  emergency_contacts: Array<Record<string, unknown>>;
  care_needs: Record<string, unknown>;
  payer_details: Record<string, unknown>;
  notes?: string;
}

export interface ClientFilterOptions {
  org_id: string;
  status?: ClientStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ClientWithSummary extends ClientProfile {
  active_authorizations_count?: number;
  documents_count?: number;
}

export interface AddClientDocumentDTO {
  client_id: string;
  org_id: string;
  category: ClientDocCategory;
  storage_path: string;
  file_name: string;
  mime_type: string;
  expiration_date?: string | null;
  uploaded_by?: string | null;
}
