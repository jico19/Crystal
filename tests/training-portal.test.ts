import { describe, it, expect, beforeEach } from 'vitest';
import {
  TrainingModuleSchema,
  SubmitQuizSchema,
  UpdateVideoProgressSchema,
} from '../packages/validation/src';
import {
  listTrainingModulesDb,
  getTrainingModuleDb,
  updateTrainingProgressDb,
  getCaregiverTrainingProgressDb,
  submitTrainingQuizDb,
  getTrainingComplianceSummaryDb,
} from '../apps/api/src/lib/db';
import {
  mockCaregiverTrainingProgress,
} from '../apps/api/src/lib/store';

describe('Feature Spec 04: In-Service Training & Continuing Education Portal', () => {
  beforeEach(() => {
    mockCaregiverTrainingProgress.clear();
  });

  describe('1. Zod Validation Schemas', () => {
    it('validates a correct training module payload', () => {
      const validModule = {
        title: 'Emergency Fall Prevention & Safe Transfers',
        description: 'Comprehensive course on gait belt usage, fall recovery, and home safety hazards.',
        category: 'emergency',
        video_url: 'https://stream.crystalhomecare.com/lessons/fall-prev.m3u8',
        video_duration_seconds: 900,
        required_hours: 1.0,
        passing_score_percentage: 80,
        quiz_questions: [
          {
            id: 'q1',
            question: 'When assisting a client with transfer from bed to wheelchair, you should:',
            options: ['Pull them by the arms', 'Use a gait belt and bend your knees', 'Let them stand alone', 'Twist your back'],
            correct_index: 1,
          },
        ],
        is_mandatory: true,
        is_active: true,
      };

      const parsed = TrainingModuleSchema.safeParse(validModule);
      expect(parsed.success).toBe(true);
    });

    it('rejects quiz submission with empty answers', () => {
      const emptySubmission = {
        caregiver_id: 'cg-001',
        module_id: 'mod-001',
        answers: [],
      };

      const parsed = SubmitQuizSchema.safeParse(emptySubmission);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.flatten().fieldErrors.answers).toBeDefined();
      }
    });

    it('validates video progress updates with non-negative watch seconds', () => {
      const validProgress = {
        caregiver_id: 'cg-001',
        module_id: 'mod-001',
        watch_progress_seconds: 450,
        total_duration_seconds: 900,
      };

      const parsed = UpdateVideoProgressSchema.safeParse(validProgress);
      expect(parsed.success).toBe(true);

      const invalidProgress = {
        caregiver_id: 'cg-001',
        module_id: 'mod-001',
        watch_progress_seconds: -10,
        total_duration_seconds: 900,
      };

      const invalidParsed = UpdateVideoProgressSchema.safeParse(invalidProgress);
      expect(invalidParsed.success).toBe(false);
    });
  });

  describe('2. Course Catalog & State Filtering', () => {
    it('returns platform-wide and state-specific modules for Georgia', async () => {
      const gaModules = await listTrainingModulesDb('GA');
      expect(gaModules.length).toBeGreaterThanOrEqual(4);
      // Georgia should receive ALL modules plus GA-specific modules, and NOT IN-specific modules
      const stateCodes = gaModules.map((m) => m.state_code);
      expect(stateCodes).toContain('ALL');
      expect(stateCodes).toContain('GA');
      expect(stateCodes).not.toContain('IN');
    });

    it('returns platform-wide and state-specific modules for Indiana', async () => {
      const inModules = await listTrainingModulesDb('IN');
      expect(inModules.length).toBeGreaterThanOrEqual(4);
      const stateCodes = inModules.map((m) => m.state_code);
      expect(stateCodes).toContain('ALL');
      expect(stateCodes).toContain('IN');
      expect(stateCodes).not.toContain('GA');
    });

    it('retrieves detailed module by ID with quiz questions', async () => {
      const moduleItem = await getTrainingModuleDb('mod-001');
      expect(moduleItem).toBeDefined();
      expect(moduleItem?.category).toBe('hipaa');
      expect(moduleItem?.quiz_questions.length).toBeGreaterThanOrEqual(2);
      expect(moduleItem?.passing_score_percentage).toBe(80);
    });
  });

  describe('3. Video Watch Progress Tracking', () => {
    it('updates watch progress percentage and flags completion at 90% threshold', async () => {
      const caregiverId = 'cg-test-101';
      const moduleId = 'mod-001'; // 900s duration

      // Watch 300s of 900s (~33%)
      const p1 = await updateTrainingProgressDb(caregiverId, moduleId, 300, 900);
      expect(p1.watch_progress_percentage).toBe(33);
      expect(p1.video_completed).toBe(false);

      // Watch 850s of 900s (~94%, >= 90% threshold)
      const p2 = await updateTrainingProgressDb(caregiverId, moduleId, 850, 900);
      expect(p2.watch_progress_percentage).toBe(94);
      expect(p2.video_completed).toBe(true);

      // Verify stored progress
      const allProgress = await getCaregiverTrainingProgressDb(caregiverId);
      expect(allProgress.length).toBe(1);
      expect(allProgress[0].video_completed).toBe(true);
    });
  });

  describe('4. End-of-Module Quiz Grading & Certificate Generation', () => {
    it('fails quiz when score is below 80% passing threshold and does not issue certificate', async () => {
      const caregiverId = 'cg-quiz-fail';
      const moduleId = 'mod-001';

      // Submit intentionally incorrect answers
      const answers = [
        { question_id: 'q1', selected_index: 3 }, // incorrect
        { question_id: 'q2', selected_index: 3 }, // incorrect
        { question_id: 'q3', selected_index: 3 }, // incorrect
      ];

      const res = await submitTrainingQuizDb(caregiverId, moduleId, answers);
      expect(res.success).toBe(true);
      expect(res.passed).toBe(false);
      expect(res.score_percentage).toBe(0);
      expect(res.certificate_hash).toBeUndefined();
      expect(res.certificate_url).toBeUndefined();

      const progress = await getCaregiverTrainingProgressDb(caregiverId);
      expect(progress[0].passed).toBe(false);
      expect(progress[0].quiz_attempts).toBe(1);
    });

    it('passes quiz with >= 80% and issues tamper-evident SHA-256 certificate hash', async () => {
      const caregiverId = 'cg-quiz-pass';
      const moduleId = 'mod-001';

      // Submit correct answers based on seed data
      // q1 correct: 0, q2 correct: 1, q3 correct: 1
      const answers = [
        { question_id: 'q1', selected_index: 0 },
        { question_id: 'q2', selected_index: 1 },
        { question_id: 'q3', selected_index: 1 },
      ];

      const res = await submitTrainingQuizDb(caregiverId, moduleId, answers);
      expect(res.success).toBe(true);
      expect(res.passed).toBe(true);
      expect(res.score_percentage).toBe(100);
      expect(res.correct_count).toBe(3);
      expect(res.certificate_hash).toBeDefined();
      expect(res.certificate_hash?.length).toBe(64); // SHA-256 hex string
      expect(res.certificate_url).toContain('/api/v1/training/certificates/');

      const progress = await getCaregiverTrainingProgressDb(caregiverId);
      expect(progress[0].passed).toBe(true);
      expect(progress[0].certificate_hash).toBe(res.certificate_hash);
    });
  });

  describe('5. Annual Training Hours & Compliance Calculation', () => {
    it('calculates total earned hours against the 12-hour annual requirement', async () => {
      const caregiverId = 'cg-compliance-check';

      // Pass module 1 (1.5 hrs)
      await submitTrainingQuizDb(caregiverId, 'mod-001', [
        { question_id: 'q1', selected_index: 0 },
        { question_id: 'q2', selected_index: 1 },
        { question_id: 'q3', selected_index: 1 },
      ]);

      // Pass module 2 (1.5 hrs)
      await submitTrainingQuizDb(caregiverId, 'mod-002', [
        { question_id: 'q1', selected_index: 1 },
        { question_id: 'q2', selected_index: 0 },
      ]);

      const summary = await getTrainingComplianceSummaryDb(caregiverId, 'GA');
      expect(summary.total_earned_hours).toBe(3.0);
      expect(summary.required_annual_hours).toBe(12.0);
      expect(summary.compliance_percentage).toBe(25); // 3.0 / 12.0 = 25%
      expect(summary.is_compliant).toBe(false);
      expect(summary.completed_modules_count).toBe(2);
    });
  });
});
