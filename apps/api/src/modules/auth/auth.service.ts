import jwt from 'jsonwebtoken';
import { db } from '../../db/index.js';
import { auditService } from '../audit/audit.service.js';
import type { UserRole } from '@crystal/types';

export interface UserAuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    org_id: string;
    state_code: string;
  };
}

export class AuthService {
  private jwtSecret = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-12345';

  async login(email: string, _password?: string, ipAddress?: string): Promise<UserAuthResult> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Fetch user and profile
    const query = `
      SELECT 
        u.id,
        u.email,
        p.role,
        p.org_id,
        p.state_code,
        p.is_active,
        p.locked_until
      FROM auth.users u
      LEFT JOIN public.user_profiles p ON p.id = u.id
      WHERE LOWER(u.email) = $1
      LIMIT 1;
    `;

    const res = await db.query(query, [cleanEmail]);
    if (res.rows.length === 0) {
      // Record failed attempt
      await auditService.logAuditEvent({
        eventType: 'AUTH_FAILED',
        resourceType: 'auth',
        ipAddress,
        metadata: { attemptedEmail: cleanEmail, reason: 'User not found' },
      });
      throw new Error('Invalid email or password');
    }

    const row = res.rows[0];

    // 2. Check active & locked status
    if (row.is_active === false) {
      throw new Error('Account has been deactivated. Please contact support.');
    }

    if (row.locked_until && new Date(row.locked_until) > new Date()) {
      throw new Error('Account is temporarily locked due to excessive failed attempts.');
    }

    const role: UserRole = row.role || 'caregiver';
    const orgId: string = row.org_id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const stateCode: string = row.state_code || 'GA';

    // 3. Issue signed JWT
    const token = jwt.sign(
      {
        sub: row.id,
        id: row.id,
        email: row.email,
        role,
        org_id: orgId,
        state_code: stateCode,
      },
      this.jwtSecret,
      { expiresIn: '7d' }
    );

    // 4. Audit log AUTH_LOGIN
    await auditService.logAuditEvent({
      userId: row.id,
      orgId,
      eventType: 'AUTH_LOGIN',
      resourceType: 'auth',
      resourceId: row.id,
      ipAddress,
      metadata: { email: row.email, role, state_code: stateCode },
    });

    return {
      token,
      user: {
        id: row.id,
        email: row.email,
        role,
        org_id: orgId,
        state_code: stateCode,
      },
    };
  }

  async listTestAccounts() {
    const query = `
      SELECT 
        u.id,
        u.email,
        p.role,
        p.state_code,
        o.name as organization_name,
        p.org_id,
        cp.id as caregiver_profile_id,
        cp.application_status
      FROM auth.users u
      JOIN public.user_profiles p ON p.id = u.id
      JOIN public.organizations o ON o.id = p.org_id
      LEFT JOIN public.caregiver_profiles cp ON cp.user_id = u.id
      ORDER BY 
        CASE p.role
          WHEN 'super_admin' THEN 1
          WHEN 'agency_admin' THEN 2
          WHEN 'care_coordinator' THEN 3
          WHEN 'registered_nurse' THEN 4
          WHEN 'caregiver' THEN 5
          ELSE 6
        END,
        p.state_code;
    `;

    const res = await db.query(query);
    return res.rows;
  }
}

export const authService = new AuthService();
