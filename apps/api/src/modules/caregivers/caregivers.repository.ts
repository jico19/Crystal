import { db } from '../../db/index.js';

export interface UpsertDraftProfileParams {
  userId?: string;
  email: string;
  orgId: string;
  stateCode: 'GA' | 'IN' | 'FL';
  sanitizedPersonalInfo: Record<string, unknown>;
}

export interface CaregiverDraftResult {
  profileId: string;
  userId?: string;
  applicationStatus: string;
  applicationStep: number;
  token?: string;
  updatedAt?: string;
}

export interface CaregiverSubmitResult {
  profileId: string;
  status: string;
  submittedAt: string;
}

export interface CaregiverProfileRecord {
  id: string;
  user_id: string;
  org_id: string;
  state_code: string;
  application_status: string;
  application_step: number;
  personal_info: Record<string, unknown>;
  positions_applied: string[];
  availability: Record<string, unknown>;
  experience_history: unknown[];
  professional_licenses: unknown[];
  references: unknown[];
  legal_disclosures: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export class CaregiversRepository {
  /**
   * Find profile by user_id
   */
  async findProfileByUserId(userId: string): Promise<CaregiverProfileRecord | null> {
    const query = `
      SELECT 
        id,
        user_id,
        org_id,
        state_code,
        application_status,
        application_step,
        personal_info,
        positions_applied,
        availability,
        experience_history,
        professional_licenses,
        "references",
        legal_disclosures,
        created_at,
        updated_at
      FROM public.caregiver_profiles
      WHERE user_id = $1
      LIMIT 1;
    `;
    const result = await db.query(query, [userId]);
    if (result.rows.length === 0) return null;
    return result.rows[0] as CaregiverProfileRecord;
  }

  /**
   * Upsert initial draft profile for a caregiver applicant (Step 1)
   */
  async upsertDraftProfile(params: UpsertDraftProfileParams): Promise<CaregiverDraftResult> {
    // 1. Ensure user exists in auth.users by email or id
    let userId = params.userId;

    if (userId) {
      const existingById = await db.query(
        `SELECT id FROM auth.users WHERE id = $1 LIMIT 1;`,
        [userId]
      );
      if (existingById.rows.length === 0) {
        const existingByEmail = await db.query(
          `SELECT id FROM auth.users WHERE email = $1 LIMIT 1;`,
          [params.email]
        );
        if (existingByEmail.rows.length > 0) {
          userId = existingByEmail.rows[0].id;
        } else {
          const insertRes = await db.query(
            `INSERT INTO auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
             RETURNING id;`,
            [
              userId,
              params.email,
              JSON.stringify({ role: 'caregiver' }),
              JSON.stringify({ role: 'caregiver', org_id: params.orgId }),
            ]
          );
          userId = insertRes.rows[0].id;
        }
      }
    } else {
      const existingByEmail = await db.query(
        `SELECT id FROM auth.users WHERE email = $1 LIMIT 1;`,
        [params.email]
      );
      if (existingByEmail.rows.length > 0) {
        userId = existingByEmail.rows[0].id;
      } else {
        const insertRes = await db.query(
          `INSERT INTO auth.users (email, raw_user_meta_data, raw_app_meta_data)
           VALUES ($1, $2, $3)
           RETURNING id;`,
          [
            params.email,
            JSON.stringify({ role: 'caregiver' }),
            JSON.stringify({ role: 'caregiver', org_id: params.orgId }),
          ]
        );
        userId = insertRes.rows[0].id;
      }
    }

    // 2. Upsert caregiver profile
    const query = `
      INSERT INTO public.caregiver_profiles (
        user_id,
        org_id,
        state_code,
        application_status,
        application_step,
        personal_info
      ) VALUES ($1, $2, $3, 'draft', 1, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        org_id = EXCLUDED.org_id,
        state_code = EXCLUDED.state_code,
        personal_info = EXCLUDED.personal_info,
        application_status = 'draft',
        application_step = GREATEST(public.caregiver_profiles.application_step, 1),
        updated_at = NOW()
      RETURNING id, user_id, application_status, application_step, updated_at;
    `;

    const values = [
      userId,
      params.orgId,
      params.stateCode,
      JSON.stringify(params.sanitizedPersonalInfo),
    ];

    const result = await db.query(query, values);
    const row = result.rows[0];

    return {
      profileId: row.id,
      userId: row.user_id,
      applicationStatus: row.application_status,
      applicationStep: row.application_step,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Update step data columns for Step 2, 3, or 4
   */
  async updateStepData(
    userId: string,
    step: number,
    fields: {
      positions_applied?: string[];
      availability?: Record<string, unknown>;
      experience_history?: unknown[];
      references?: unknown[];
      professional_licenses?: unknown[];
    }
  ): Promise<CaregiverDraftResult> {
    const setClauses: string[] = [
      `application_step = GREATEST(application_step, $2)`,
      `updated_at = NOW()`,
    ];
    const values: unknown[] = [userId, step];
    let paramIndex = 3;

    if (fields.positions_applied !== undefined) {
      setClauses.push(`positions_applied = $${paramIndex++}`);
      values.push(fields.positions_applied);
    }
    if (fields.availability !== undefined) {
      setClauses.push(`availability = $${paramIndex++}`);
      values.push(JSON.stringify(fields.availability));
    }
    if (fields.experience_history !== undefined) {
      setClauses.push(`experience_history = $${paramIndex++}`);
      values.push(JSON.stringify(fields.experience_history));
    }
    if (fields.references !== undefined) {
      setClauses.push(`"references" = $${paramIndex++}`);
      values.push(JSON.stringify(fields.references));
    }
    if (fields.professional_licenses !== undefined) {
      setClauses.push(`professional_licenses = $${paramIndex++}`);
      values.push(JSON.stringify(fields.professional_licenses));
    }

    const query = `
      UPDATE public.caregiver_profiles
      SET ${setClauses.join(', ')}
      WHERE user_id = $1 AND application_status = 'draft'
      RETURNING id, application_status, application_step, updated_at;
    `;

    const result = await db.query(query, values);
    const row = result.rows[0];

    return {
      profileId: row.id,
      applicationStatus: row.application_status,
      applicationStep: row.application_step,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Finalize and submit application profile (Step 5)
   */
  async submitProfile(
    userId: string,
    legalDisclosures: Record<string, unknown>
  ): Promise<CaregiverSubmitResult> {
    const query = `
      UPDATE public.caregiver_profiles
      SET 
        legal_disclosures = $2,
        application_status = 'submitted',
        application_step = 5,
        submitted_at = NOW(),
        onboarding_checklist = jsonb_set(onboarding_checklist, '{application_form}', '"submitted"'),
        updated_at = NOW()
      WHERE user_id = $1 AND application_status = 'draft'
      RETURNING id, application_status, submitted_at;
    `;

    const result = await db.query(query, [userId, JSON.stringify(legalDisclosures)]);
    const row = result.rows[0];

    return {
      profileId: row.id,
      status: row.application_status,
      submittedAt: row.submitted_at,
    };
  }
}

export const caregiversRepository = new CaregiversRepository();
