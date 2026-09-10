import crypto from 'crypto';
import { trainingRepository } from './training.repository.js';
import type { TrainingModule, CaregiverTrainingProgress, QuizQuestion } from '@crystal/types';
import type { QuizSubmissionInput, VideoProgressUpdateInput } from '@crystal/validation';
import type { QuizSubmissionResult, CertificateDetails } from './training.types.js';

export class TrainingService {
  /**
   * Fetch courses catalog merged with caregiver progress
   */
  async listModulesWithProgress(
    caregiverId: string,
    orgId?: string,
    stateCode?: string
  ): Promise<(TrainingModule & { progress?: CaregiverTrainingProgress })[]> {
    const modules = await trainingRepository.findModules(orgId, stateCode);
    const progressList = await trainingRepository.findCaregiverProgress(caregiverId);

    const progressMap = new Map<string, CaregiverTrainingProgress>();
    for (const p of progressList) {
      progressMap.set(p.module_id, p);
    }

    return modules.map((m) => ({
      ...m,
      progress: progressMap.get(m.id),
    }));
  }

  /**
   * Update video playback progress with anti-skip heuristic
   */
  async updateVideoProgress(
    caregiverId: string,
    input: VideoProgressUpdateInput
  ): Promise<CaregiverTrainingProgress> {
    const module = await trainingRepository.findModuleById(input.module_id);
    if (!module) {
      throw new Error('Training module not found');
    }

    // Anti-skip heuristic: cannot jump forward more than 60 seconds per single update call
    if (input.delta_seconds > 60) {
      throw new Error('Video progress update rejected: Seeking forward past watched boundary is prohibited');
    }

    const duration = module.duration_seconds || 1;
    const watchPercentage = Math.min(100, Math.round((input.watched_seconds / duration) * 100));
    const videoCompleted = watchPercentage >= 90;

    return trainingRepository.upsertVideoProgress({
      caregiverId,
      moduleId: input.module_id,
      watchSeconds: Math.floor(input.watched_seconds),
      watchPercentage,
      videoCompleted,
    });
  }

  /**
   * Grade quiz answers and issue cryptographic SHA-256 certificate upon passing
   */
  async submitQuiz(
    caregiverId: string,
    input: QuizSubmissionInput
  ): Promise<QuizSubmissionResult> {
    const module = await trainingRepository.findModuleById(input.module_id);
    if (!module) {
      throw new Error('Training module not found');
    }

    // Verify video completion gate (Anti-skip enforcement)
    const existingProgress = await trainingRepository.findModuleProgress(caregiverId, input.module_id);
    const watchPct = existingProgress ? Number(existingProgress.watch_progress_percentage) : 0;

    if (!existingProgress?.video_completed && watchPct < 90) {
      throw new Error(
        `Quiz is locked. You must complete at least 90% of the training video before attempting the knowledge check (Current: ${watchPct}%).`
      );
    }

    const questions = (module.quiz_questions || []) as unknown as QuizQuestion[];

    if (!questions || questions.length === 0) {
      throw new Error('Module has no questions configured');
    }

    let correctCount = 0;
    const incorrectQuestionIds: string[] = [];

    for (const q of questions) {
      const selectedOption = input.answers[q.id];
      if (selectedOption !== undefined && Number(selectedOption) === Number(q.correct_index)) {
        correctCount++;
      } else {
        incorrectQuestionIds.push(q.id);
      }
    }

    const totalQuestions = questions.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = scorePercentage >= module.passing_score_pct;

    // Generate tamper-evident SHA-256 certificate hash if passing on first try or new certificate
    let certHash: string | undefined = undefined;
    if (passed && !existingProgress?.certificate_hash) {
      certHash = crypto
        .createHash('sha256')
        .update(`${caregiverId}:${module.id}:${Date.now()}:${scorePercentage}:CRYSTAL_LMS_SIGNATURE`)
        .digest('hex');
    }

    const updatedProgress = await trainingRepository.recordQuizAttempt({
      caregiverId,
      moduleId: input.module_id,
      scorePercentage,
      passed,
      certificateHash: certHash,
    });

    return {
      passed,
      score_percentage: scorePercentage,
      passing_score_pct: module.passing_score_pct,
      total_questions: totalQuestions,
      correct_count: correctCount,
      quiz_attempts: updatedProgress.quiz_attempts,
      certificate_hash: updatedProgress.certificate_hash,
      certificate_issued: passed,
      incorrect_question_ids: incorrectQuestionIds,
    };
  }

  /**
   * Get verified certificate details
   */
  async getCertificate(progressId: string): Promise<CertificateDetails> {
    const cert = await trainingRepository.getCertificateDetails(progressId);
    if (!cert) {
      throw new Error('Valid completion certificate not found');
    }
    return cert;
  }
}

export const trainingService = new TrainingService();
