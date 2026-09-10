import type { TrainingModule, CaregiverTrainingProgress } from '@crystal/types';

export type { TrainingModule, CaregiverTrainingProgress };

export interface QuizSubmissionResult {
  passed: boolean;
  score_percentage: number;
  passing_score_pct: number;
  total_questions: number;
  correct_count: number;
  quiz_attempts: number;
  certificate_hash?: string | null;
  certificate_issued: boolean;
  incorrect_question_ids: string[];
}

export interface CertificateDetails {
  certificate_id: string;
  caregiver_id: string;
  caregiver_name: string;
  module_id: string;
  module_title: string;
  required_hours: number;
  passing_score_pct: number;
  highest_score: number;
  completed_at: string;
  certificate_hash: string;
  organization_name: string;
  state_code: string;
}
