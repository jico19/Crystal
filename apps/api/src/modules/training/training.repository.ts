import { db } from '../../db/index.js';
import type { TrainingModule, CaregiverTrainingProgress } from '@crystal/types';

export class TrainingRepository {
  /**
   * Find modules available for an organization (org-specific + platform-wide)
   */
  async findModules(orgId?: string, stateCode?: string): Promise<TrainingModule[]> {
    const query = `
      SELECT * FROM public.training_modules
      WHERE (org_id IS NULL OR org_id = $1)
        AND (state_code = 'ALL' OR state_code = $2)
      ORDER BY created_at ASC;
    `;
    const res = await db.query(query, [orgId || null, stateCode || 'ALL']);
    return res.rows;
  }

  async findModuleById(id: string): Promise<TrainingModule | null> {
    const res = await db.query(
      `SELECT * FROM public.training_modules WHERE id = $1;`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findCaregiverProgress(caregiverId: string): Promise<CaregiverTrainingProgress[]> {
    const res = await db.query(
      `SELECT * FROM public.caregiver_training_progress WHERE caregiver_id = $1;`,
      [caregiverId]
    );
    return res.rows;
  }

  async findModuleProgress(caregiverId: string, moduleId: string): Promise<CaregiverTrainingProgress | null> {
    const res = await db.query(
      `SELECT * FROM public.caregiver_training_progress
       WHERE caregiver_id = $1 AND module_id = $2;`,
      [caregiverId, moduleId]
    );
    return res.rows[0] || null;
  }

  async upsertVideoProgress(params: {
    caregiverId: string;
    moduleId: string;
    watchSeconds: number;
    watchPercentage: number;
    videoCompleted: boolean;
  }): Promise<CaregiverTrainingProgress> {
    const query = `
      INSERT INTO public.caregiver_training_progress (
        caregiver_id, module_id, watch_progress_seconds, watch_progress_percentage, video_completed
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (caregiver_id, module_id) DO UPDATE SET
        watch_progress_seconds = GREATEST(caregiver_training_progress.watch_progress_seconds, EXCLUDED.watch_progress_seconds),
        watch_progress_percentage = GREATEST(caregiver_training_progress.watch_progress_percentage, EXCLUDED.watch_progress_percentage),
        video_completed = caregiver_training_progress.video_completed OR EXCLUDED.video_completed,
        updated_at = NOW()
      RETURNING *;
    `;
    const values = [
      params.caregiverId,
      params.moduleId,
      params.watchSeconds,
      params.watchPercentage,
      params.videoCompleted,
    ];
    const res = await db.query(query, values);
    return res.rows[0];
  }

  async recordQuizAttempt(params: {
    caregiverId: string;
    moduleId: string;
    scorePercentage: number;
    passed: boolean;
    certificateHash?: string;
  }): Promise<CaregiverTrainingProgress> {
    const query = `
      INSERT INTO public.caregiver_training_progress (
        caregiver_id, module_id, quiz_attempts, highest_score, passed, completed_at, certificate_hash
      ) VALUES ($1, $2, 1, $3, $4, CASE WHEN $4 THEN NOW() ELSE NULL END, $5)
      ON CONFLICT (caregiver_id, module_id) DO UPDATE SET
        quiz_attempts = caregiver_training_progress.quiz_attempts + 1,
        highest_score = GREATEST(caregiver_training_progress.highest_score, EXCLUDED.highest_score),
        passed = caregiver_training_progress.passed OR EXCLUDED.passed,
        completed_at = COALESCE(caregiver_training_progress.completed_at, CASE WHEN EXCLUDED.passed THEN NOW() ELSE NULL END),
        certificate_hash = COALESCE(caregiver_training_progress.certificate_hash, EXCLUDED.certificate_hash),
        updated_at = NOW()
      RETURNING *;
    `;
    const values = [
      params.caregiverId,
      params.moduleId,
      params.scorePercentage,
      params.passed,
      params.certificateHash || null,
    ];
    const res = await db.query(query, values);
    return res.rows[0];
  }

  async getCertificateDetails(progressId: string): Promise<any | null> {
    const query = `
      SELECT
        ctp.id as certificate_id,
        ctp.caregiver_id,
        CONCAT(cp.personal_info->>'first_name', ' ', cp.personal_info->>'last_name') as caregiver_name,
        tm.id as module_id,
        tm.title as module_title,
        tm.required_hours,
        tm.passing_score_pct,
        ctp.highest_score,
        ctp.completed_at,
        ctp.certificate_hash,
        o.name as organization_name,
        o.state_code
      FROM public.caregiver_training_progress ctp
      JOIN public.training_modules tm ON tm.id = ctp.module_id
      JOIN public.caregiver_profiles cp ON cp.id = ctp.caregiver_id
      JOIN public.organizations o ON o.id = cp.org_id
      WHERE ctp.id = $1 AND ctp.passed = true;
    `;
    const res = await db.query(query, [progressId]);
    return res.rows[0] || null;
  }
}

export const trainingRepository = new TrainingRepository();
