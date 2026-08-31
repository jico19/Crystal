# Feature Specification: In-Service Training & Continuing Education Portal

## 1. Executive Summary & Scope

### 1.1 Goal
Provide a fully digital in-service training and continuing education learning management portal enabling Georgia and Indiana caregivers to complete state-mandated training modules (e.g., Elder Abuse, HIPAA, Infection Control, Emergency Procedures), take end-of-module knowledge checks, and automatically earn verifiable completion certificates.

### 1.2 Problem Statement
Tracking mandatory annual in-service hours (12+ hours per caregiver per year in Georgia and Indiana) currently requires manual sign-in sheets, paper quizzes, and ad-hoc filing. Missing training records expose the agency to severe audit citations and loss of operating licenses.

### 1.3 Scope Boundaries
- **In-Scope:**
  - Video lesson streaming player with anti-skipping playback tracking.
  - Interactive multiple-choice knowledge checks with 80% passing grade enforcement.
  - Automated PDF certificate generation with unique verification hashes.
  - Admin training compliance dashboard tracking completion percentages per state.
- **Out-of-Scope:**
  - Live virtual classroom / WebRTC video conferencing (all training is asynchronous on-demand).

---

## 2. PostgreSQL Database Schema (DDL) & RLS Policies

```sql
-- Training Modules Table
CREATE TABLE IF NOT EXISTS public.training_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE, -- NULL means platform-wide
    state_code VARCHAR(2) CHECK (state_code IN ('GA', 'IN', 'FL', 'ALL')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'hipaa', 'infection_control', 'elder_abuse', 'dementia'
    video_url TEXT NOT NULL,         -- Cloudflare Stream / Mux / Vimeo HLS URL
    video_duration_seconds INT NOT NULL,
    required_hours NUMERIC(4,2) NOT NULL DEFAULT 1.00,
    passing_score_percentage INT NOT NULL DEFAULT 80,
    quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ id, question, options: [], correct_index }]
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Caregiver Training Progress & Quiz Results Table
CREATE TABLE IF NOT EXISTS public.caregiver_training_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID NOT NULL REFERENCES public.caregiver_profiles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
    watch_progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    video_completed BOOLEAN NOT NULL DEFAULT false,
    quiz_attempts INT NOT NULL DEFAULT 0,
    quiz_score_percentage INT,
    passed BOOLEAN NOT NULL DEFAULT false,
    certificate_url TEXT,
    certificate_hash VARCHAR(64),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(caregiver_id, module_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_progress_caregiver ON public.caregiver_training_progress(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_training_modules_state ON public.training_modules(state_code, is_active);

-- Enable RLS
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_training_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public authenticated view active training modules"
ON public.training_modules FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Caregivers manage own training progress"
ON public.caregiver_training_progress FOR ALL
TO authenticated
USING (
    caregiver_id IN (SELECT id FROM public.caregiver_profiles WHERE user_id = auth.uid())
    OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('coordinator', 'admin', 'super_admin')
);
```

---

## 3. TypeScript & Zod Validation Schemas

```typescript
import { z } from 'zod';

export const QuizSubmissionSchema = z.object({
  module_id: z.string().uuid(),
  answers: z.array(z.object({
    question_id: z.string(),
    selected_index: z.number().int().min(0).max(10),
  })).min(1, 'All questions must be answered'),
});

export const VideoProgressUpdateSchema = z.object({
  module_id: z.string().uuid(),
  watch_progress_seconds: z.number().min(0),
  total_duration_seconds: z.number().min(1),
});
```

---

## 4. Server Actions & API Endpoint Specifications

### 4.1 Server Action: `submitModuleQuiz`
```typescript
'use server';

import { QuizSubmissionSchema } from '@/lib/schemas/training';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generatePdfCertificate } from '@/lib/services/certificate-generator';
import crypto from 'crypto';

export async function submitModuleQuiz(rawInput: z.infer<typeof QuizSubmissionSchema>) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: moduleData } = await supabase
    .from('training_modules')
    .select('*')
    .eq('id', rawInput.module_id)
    .single();

  if (!moduleData) throw new Error('Module not found');

  // Grade Quiz
  const questions = moduleData.quiz_questions as Array<{ id: string; correct_index: number }>;
  let correctCount = 0;

  for (const q of questions) {
    const submitted = rawInput.answers.find((a) => a.question_id === q.id);
    if (submitted && submitted.selected_index === q.correct_index) {
      correctCount++;
    }
  }

  const scorePercentage = Math.round((correctCount / questions.length) * 100);
  const passed = scorePercentage >= moduleData.passing_score_percentage;

  let certUrl: string | undefined;
  let certHash: string | undefined;

  if (passed) {
    certHash = crypto.createHash('sha256').update(`${user.id}-${moduleData.id}-${Date.now()}`).digest('hex');
    certUrl = await generatePdfCertificate({
      userName: user.user_metadata.full_name || 'Caregiver',
      moduleTitle: moduleData.title,
      hours: moduleData.required_hours,
      hash: certHash,
    });
  }

  const { data: progress, error } = await supabase
    .from('caregiver_training_progress')
    .upsert({
      caregiver_id: user.user_metadata.caregiver_id,
      module_id: moduleData.id,
      quiz_score_percentage: scorePercentage,
      passed,
      certificate_url: certUrl,
      certificate_hash: certHash,
      completed_at: passed ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, scorePercentage, passed, certUrl };
}
```

---

## 5. UI/UX & Component Architecture

### 5.1 Component Tree
```
src/app/(portals)/training/
├── page.tsx                           # Course Catalog & Annual Hours Progress Bar
├── [moduleId]/
│   ├── page.tsx                       # Lesson Player & Transcript view
│   ├── VideoPlayer.tsx                # Custom player with disabled seek-forward
│   ├── QuizModal.tsx                  # Interactive knowledge check dialog
│   └── CertificateModal.tsx           # Downloadable / printable PDF modal
```

---

## 6. Background Automation & Agent Triggers

- **Trigger:** `caregiver_training_progress.UPDATE` with `passed = true`
- **Agent Integration:** `Agent-Training`
- **Workflow:**
  1. Increments caregiver's cumulative annual CEU hours.
  2. Updates `caregiver_profiles.onboarding_checklist->in_service_orientation` to `'verified'` once core modules are completed.
  3. Dispatches automated congratulations email with attached PDF certificate via Amazon SES.

---

## 7. Edge Cases & Failure Recovery Matrix

| Failure Scenario | Root Cause | System Response & Mitigation |
| :--- | :--- | :--- |
| **Fast-Forward / Video Skipping** | Caregiver attempts to skip to quiz | VideoPlayer disables seeking ahead of playback time; quiz locked until $90\%+$ watch threshold met. |
| **Failed Quiz Attempt** | Score $< 80\%$ | Explains incorrect concepts (without revealing exact answer keys) and permits retake. |
| **PDF Generation Error** | Certificate builder times out | Quiz marked passed in DB; background job retries certificate rendering and notifies user when ready. |

---

## 8. Acceptance Test Suite (Gherkin Syntax)

```gherkin
Feature: In-Service Training & Certification

  Scenario: Caregiver completes video and passes quiz
    Given an authenticated caregiver watching "HIPAA Compliance 101"
    When the caregiver completes 100% of the video
    And scores 90% on the end-of-module quiz
    Then the module is marked as "passed"
    And a verifiable PDF certificate is instantly generated
    And the caregiver's annual completed hours increase by 1.0
```
