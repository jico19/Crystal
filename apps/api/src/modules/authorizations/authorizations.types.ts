import type { ClientAuthorization, AuthorizationStatus, UnitBurndownSummary } from '@crystal/types';

export interface CreateAuthorizationDTO {
  client_id: string;
  org_id: string;
  auth_number: string;
  payer_id: string;
  service_code: string;
  start_date: string;
  end_date: string;
  total_units_authorized: number;
  weekly_unit_cap?: number | null;
  notes?: string | null;
}

export interface UpdateUnitsDTO {
  authorization_id: string;
  units_used_delta: number;
  service_date?: string;
  notes?: string;
  logged_by?: string;
}

export interface AuthorizationFilterOptions {
  org_id: string;
  client_id?: string;
  status?: AuthorizationStatus;
  at_risk_only?: boolean;
  limit?: number;
  offset?: number;
}

export interface AuthorizationWithClient extends ClientAuthorization {
  client_first_name?: string;
  client_last_name?: string;
  medicaid_id?: string;
}

export { UnitBurndownSummary };
