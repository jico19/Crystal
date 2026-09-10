-- ============================================================================
-- Migration 005: In-Service Training Portal & Certification (Spec 04)
-- ============================================================================

-- Step 1: Create training_modules table
CREATE TABLE IF NOT EXISTS public.training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  video_url TEXT NOT NULL,
  duration_seconds INT NOT NULL DEFAULT 600,
  passing_score_pct INT NOT NULL DEFAULT 80,
  required_hours NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
  quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  state_code VARCHAR(10) NOT NULL DEFAULT 'ALL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_modules_org_state ON public.training_modules(org_id, state_code);

-- Auto-update trigger for training_modules
CREATE OR REPLACE FUNCTION update_training_modules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_training_modules_updated_at ON public.training_modules;
CREATE TRIGGER trg_training_modules_updated_at
  BEFORE UPDATE ON public.training_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_training_modules_timestamp();

-- Step 2: Create caregiver_training_progress table
CREATE TABLE IF NOT EXISTS public.caregiver_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL REFERENCES public.caregiver_profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
  watch_progress_seconds INT NOT NULL DEFAULT 0,
  watch_progress_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  video_completed BOOLEAN NOT NULL DEFAULT false,
  quiz_attempts INT NOT NULL DEFAULT 0,
  highest_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  passed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ NULL,
  certificate_hash VARCHAR(64) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_caregiver_module UNIQUE (caregiver_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_training_progress_caregiver ON public.caregiver_training_progress(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_passed ON public.caregiver_training_progress(passed);

-- Auto-update trigger for caregiver_training_progress
DROP TRIGGER IF EXISTS trg_caregiver_training_progress_updated_at ON public.caregiver_training_progress;
CREATE TRIGGER trg_caregiver_training_progress_updated_at
  BEFORE UPDATE ON public.caregiver_training_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_training_modules_timestamp();

-- Step 3: Seed initial core training modules
INSERT INTO public.training_modules (
  id,
  org_id,
  title,
  description,
  video_url,
  duration_seconds,
  passing_score_pct,
  required_hours,
  quiz_questions,
  is_mandatory,
  state_code
) VALUES (
  'c0000000-0000-0000-0000-000000000001',
  NULL,
  'HIPAA Compliance & Client Privacy in Home Care',
  'Understand federal standards for handling Protected Health Information (PHI), client confidentiality, and mobile device security in field care.',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  300,
  80,
  1.00,
  '[
    {
      "id": "q1",
      "question": "Which of the following is considered Protected Health Information (PHI)?",
      "options": ["Client name and care plan details", "Weather forecast for client city", "General care agency office address", "Standard uniform dress code policy"],
      "correct_index": 0
    },
    {
      "id": "q2",
      "question": "What is the appropriate protocol if you discover an unencrypted client file left unattended?",
      "options": ["Take a photo with your personal phone", "Immediately secure the document and notify your supervisor/compliance officer", "Throw it in the client regular trash", "Ignore it unless asked by the family"],
      "correct_index": 1
    },
    {
      "id": "q3",
      "question": "Can you discuss a client health condition with a neighbor who asks how they are doing?",
      "options": ["Yes, if the neighbor is friendly", "No, discussing PHI with unauthorized individuals violates HIPAA", "Yes, as long as you do not mention their last name", "Only on weekends"],
      "correct_index": 1
    },
    {
      "id": "q4",
      "question": "Where should electronic care notes be documented?",
      "options": ["In a public WhatsApp chat group", "Exclusively within the authorized, encrypted Crystal care portal", "On personal social media accounts", "On sticky notes on your vehicle dashboard"],
      "correct_index": 1
    }
  ]'::jsonb,
  true,
  'ALL'
), (
  'c0000000-0000-0000-0000-000000000002',
  NULL,
  'Infection Control, PPE & Bloodborne Pathogens',
  'Master standard infection prevention precautions, proper hand hygiene, and safe disposal of biohazardous materials.',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  240,
  80,
  1.00,
  '[
    {
      "id": "q1",
      "question": "What is the single most effective way to prevent the spread of infections?",
      "options": ["Wearing perfume or cologne", "Thorough hand hygiene with soap and water for at least 20 seconds", "Opening all windows in the house", "Drinking hot herbal tea"],
      "correct_index": 1
    },
    {
      "id": "q2",
      "question": "When should Personal Protective Equipment (PPE) like disposable gloves be removed?",
      "options": ["After leaving the client home", "Immediately after completing task involving bodily fluids and before touching clean surfaces", "Gloves can be washed and reused all day", "At the end of your weekly shift"],
      "correct_index": 1
    },
    {
      "id": "q3",
      "question": "What should you do immediately if you experience an accidental needle stick or skin exposure?",
      "options": ["Wash the area thoroughly with soap and water and immediately report to clinical supervisor", "Wait 48 hours to see if symptoms appear", "Cover with a regular band-aid and continue without reporting", "Soak in hot water with salt"],
      "correct_index": 0
    }
  ]'::jsonb,
  true,
  'ALL'
), (
  'c0000000-0000-0000-0000-000000000003',
  NULL,
  'Fall Prevention & Client Transfer Safety',
  'Identify common home hazards, master safe transfer mechanics, and respond appropriately when a client experiences loss of balance.',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  360,
  80,
  1.00,
  '[
    {
      "id": "q1",
      "question": "Which room in a typical client home carries the highest statistical risk for accidental falls?",
      "options": ["Bathroom", "Dining room", "Backyard patio", "Home office"],
      "correct_index": 0
    },
    {
      "id": "q2",
      "question": "When assisting a client from a bed to a wheelchair, you should:",
      "options": ["Lock both wheelchair brakes and keep your feet shoulder-width apart for a stable base of support", "Leave wheelchair brakes unlocked so it can roll freely", "Bend at your waist rather than bending your knees", "Twist your torso rapidly during the lift"],
      "correct_index": 0
    },
    {
      "id": "q3",
      "question": "What should you do if a client begins falling while walking with you?",
      "options": ["Try to catch them forcefully with your arms straight", "Ease them gently to the floor protecting their head and call for assistance", "Let go and run outside for help", "Yell at them to stand back up immediately"],
      "correct_index": 1
    }
  ]'::jsonb,
  true,
  'ALL'
)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Row-Level Security (RLS)
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_training_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to training_modules for service_role" ON public.training_modules;
CREATE POLICY "Allow all access to training_modules for service_role"
  ON public.training_modules
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to caregiver_training_progress for service_role" ON public.caregiver_training_progress;
CREATE POLICY "Allow all access to caregiver_training_progress for service_role"
  ON public.caregiver_training_progress
  FOR ALL
  USING (true)
  WITH CHECK (true);
