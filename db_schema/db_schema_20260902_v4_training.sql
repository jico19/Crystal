-- ============================================================================
-- Crystal Multi-State Platform: Database Schema Snapshot v4
-- Feature Spec 04: In-Service Training & Continuing Education Portal
-- Date: 2026-09-02
-- Target: PostgreSQL 16 / Supabase / PGlite
-- ============================================================================

-- 1. Training Modules Catalog Table
CREATE TABLE IF NOT EXISTS public.training_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE, -- NULL means platform-wide
    state_code VARCHAR(10) NOT NULL DEFAULT 'ALL' CHECK (state_code IN ('GA', 'IN', 'FL', 'ALL')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'hipaa', 'infection_control', 'elder_abuse', 'client_rights', 'emergency'
    video_url TEXT NOT NULL,         -- Cloudflare Stream / Mux / Vimeo HLS URL or simulated stream
    video_duration_seconds INT NOT NULL,
    required_hours NUMERIC(4,2) NOT NULL DEFAULT 1.00,
    passing_score_percentage INT NOT NULL DEFAULT 80,
    quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ id, question, options: [], correct_index }]
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Caregiver Training Progress & Quiz Results Table
CREATE TABLE IF NOT EXISTS public.caregiver_training_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE INDEX IF NOT EXISTS idx_training_progress_module ON public.caregiver_training_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_training_modules_state ON public.training_modules(state_code, is_active);

-- Enable Row-Level Security
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_training_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public authenticated view active training modules" ON public.training_modules;
CREATE POLICY "Public authenticated view active training modules"
ON public.training_modules FOR SELECT
TO authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Caregivers manage own training progress" ON public.caregiver_training_progress;
CREATE POLICY "Caregivers manage own training progress"
ON public.caregiver_training_progress FOR ALL
TO authenticated
USING (
    caregiver_id IN (SELECT id FROM public.caregiver_profiles WHERE user_id = auth.uid())
    OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('coordinator', 'admin', 'super_admin', 'training_admin')
);
