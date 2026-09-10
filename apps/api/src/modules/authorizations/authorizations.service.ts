import { authorizationsRepository } from './authorizations.repository.js';
import { auditService } from '../audit/audit.service.js';
import type {
  ClientAuthorization,
  AuthenticatedUser,
  UnitBurndownSummary,
} from '@crystal/types';
import type {
  CreateAuthorizationInput,
  UpdateAuthorizationUnitsInput,
} from '@crystal/validation';
import type {
  AuthorizationFilterOptions,
  AuthorizationWithClient,
} from './authorizations.types.js';

export class AuthorizationsService {
  async createAuthorization(
    input: CreateAuthorizationInput,
    user: AuthenticatedUser,
    orgId: string,
    ipAddress?: string
  ): Promise<ClientAuthorization> {
    if (new Date(input.end_date) < new Date(input.start_date)) {
      throw new Error('Authorization end_date cannot be earlier than start_date');
    }

    const auth = await authorizationsRepository.create({
      client_id: input.client_id,
      org_id: orgId,
      auth_number: input.auth_number,
      payer_id: input.payer_id,
      service_code: input.service_code || 'T1019',
      start_date: input.start_date,
      end_date: input.end_date,
      total_units_authorized: input.total_units_authorized,
      weekly_unit_cap: input.weekly_unit_cap,
      notes: input.notes,
    });

    await auditService.logAuditEvent({
      orgId: orgId,
      userId: user.id,
      eventType: 'RECORD_MUTATION',
      resourceType: 'client_authorization',
      resourceId: auth.id,
      ipAddress: ipAddress,
      metadata: {
        action: 'CREATE_AUTHORIZATION',
        auth_number: auth.auth_number,
        total_units: auth.total_units_authorized,
      },
    });

    return auth;
  }

  async getClientAuthorizations(clientId: string, orgId: string): Promise<ClientAuthorization[]> {
    return await authorizationsRepository.findByClientId(clientId, orgId);
  }

  async listAuthorizations(
    options: AuthorizationFilterOptions
  ): Promise<{ authorizations: AuthorizationWithClient[]; total: number }> {
    return await authorizationsRepository.findMany(options);
  }

  async getBurndownSummary(authId: string, orgId: string): Promise<UnitBurndownSummary> {
    const auth = await authorizationsRepository.findById(authId, orgId);
    if (!auth) {
      throw new Error(`Authorization ${authId} not found`);
    }

    const total = auth.total_units_authorized;
    const used = auth.total_units_used;
    const remaining = Math.max(0, total - used);
    const utilizationPct = total > 0 ? Math.round((used / total) * 100) : 0;

    const now = new Date();
    const end = new Date(auth.end_date);
    const diffTime = end.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // At risk if <= 30 days left, or remaining units <= 15% of total, or utilization >= 85%
    const isAtRisk =
      daysRemaining <= 30 ||
      remaining <= total * 0.15 ||
      utilizationPct >= 85 ||
      auth.status === 'exhausted' ||
      auth.status === 'expiring_soon' ||
      auth.status === 'expired';

    const clientName = `${auth.client_first_name || ''} ${auth.client_last_name || ''}`.trim() || 'Client';

    return {
      authorization_id: auth.id,
      client_name: clientName,
      service_code: auth.service_code,
      total_units: total,
      used_units: used,
      remaining_units: remaining,
      utilization_percentage: utilizationPct,
      days_remaining: daysRemaining,
      is_at_risk: isAtRisk,
    };
  }

  async updateUnitsUsed(
    authId: string,
    orgId: string,
    input: UpdateAuthorizationUnitsInput,
    user: AuthenticatedUser,
    ipAddress?: string
  ): Promise<ClientAuthorization> {
    const auth = await authorizationsRepository.findById(authId, orgId);
    if (!auth) {
      throw new Error(`Authorization ${authId} not found`);
    }

    const nextUsed = auth.total_units_used + input.units_used_delta;
    let nextStatus = auth.status;

    if (nextUsed >= auth.total_units_authorized) {
      nextStatus = 'exhausted';
    }

    const updated = await authorizationsRepository.addUnitsUsed(
      authId,
      input.units_used_delta,
      nextStatus !== auth.status ? nextStatus : undefined
    );

    if (!updated) {
      throw new Error(`Failed to update units on authorization ${authId}`);
    }

    await authorizationsRepository.logUnitUsage({
      authorization_id: authId,
      units_used_delta: input.units_used_delta,
      service_date: input.service_date,
      notes: input.notes,
      logged_by: user.id,
    });

    await auditService.logAuditEvent({
      orgId: orgId,
      userId: user.id,
      eventType: 'RECORD_MUTATION',
      resourceType: 'client_authorization',
      resourceId: authId,
      ipAddress: ipAddress,
      metadata: {
        action: 'DEDUCT_AUTHORIZATION_UNITS',
        units_delta: input.units_used_delta,
        new_total_used: updated.total_units_used,
        status: updated.status,
      },
    });

    return updated;
  }

  async runExpirationCheck(): Promise<{ expiredCount: number; expiringSoonCount: number }> {
    return await authorizationsRepository.updateStatusesByDates();
  }
}

export const authorizationsService = new AuthorizationsService();
