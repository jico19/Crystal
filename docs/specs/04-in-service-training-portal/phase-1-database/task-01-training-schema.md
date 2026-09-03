# Task 01: Create In-Service Training Database Schema

**Spec:** `04-in-service-training-portal` | **Phase:** 1-Database | **Task:** 01

## Prerequisites
- `public.organizations` table exists (Spec 01).
- `public.caregiver_profiles` table exists (Spec 02).
- `auth.users` table exists (Supabase Auth).
- `uuid-ossp` extension enabled in PostgreSQL (`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`).

## Context
This task establishes the persistence layer for the in-service training and continuing education learning management system. Two tables are required: `training_modules` to store curriculum content, video URLs, credit hours, and JSONB question banks, and `caregiver_training_progress` to track watch progress, quiz scores, pass status, and verifiable completion certificates per caregiver. Row-level security guarantees that caregivers can access active training modules and manipulate only their own learning records while giving compliance staff full oversight.

## Stack & Files
- **Layer:** Database Migration
- **Create:** `db_schema/migrations/004_training_and_certifications.sql` — DDL for training tables, indexes, and RLS policies

## Deliverable
A single idempotent SQL migration file that creates `public.training_modules` and `public.caregiver_training_progress`, configures indexes for fast state and caregiver queries, enables RLS on both tables, and applies policies allowing authenticated users to view active modules and caregivers to view/upsert their own progress records.

## Inputs
None — this is a DDL migration with no runtime inputs.

## Outputs
After applying the migration:
- `training_modules` table exists with columns:
  - `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
  - `org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE` (nullable; NULL indicates platform-wide)
  - `state_code VARCHAR(2) CHECK (state_code IN ('GA', 'IN', 'FL', 'ALL'))`
  - `title VARCHAR(255) NOT NULL`
  - `description TEXT NOT NULL`
  - `category VARCHAR(100) NOT NULL`
  - `video_url TEXT NOT NULL`
  - `video_duration_seconds INT NOT NULL`
  - `required_hours NUMERIC(4,2) NOT NULL DEFAULT 1.00`
  - `passing_score_percentage INT NOT NULL DEFAULT 80`
  - `quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb`
  - `is_mandatory BOOLEAN NOT NULL DEFAULT true`
  - `is_active BOOLEAN NOT NULL DEFAULT true`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `caregiver_training_progress` table exists with columns:
  - `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
  - `caregiver_id UUID NOT NULL REFERENCES public.caregiver_profiles(id) ON DELETE CASCADE`
  - `module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE`
  - `watch_progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00`
  - `video_completed BOOLEAN NOT NULL DEFAULT false`
  - `quiz_attempts INT NOT NULL DEFAULT 0`
  - `quiz_score_percentage INT`
  - `passed BOOLEAN NOT NULL DEFAULT false`
  - `certificate_url TEXT`
  - `certificate_hash VARCHAR(64)`
  - `completed_at TIMESTAMPTZ`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `UNIQUE(caregiver_id, module_id)`
- Indexes: `idx_training_modules_state_active` on `(state_code, is_active)`, `idx_training_progress_caregiver` on `(caregiver_id)`, and `idx_training_progress_module` on `(module_id)`.
- RLS enabled on both tables with policies for active module reads and caregiver progress ownership.

## Acceptance Criteria
- [ ] Running the migration twice produces no errors (uses `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).
- [ ] `caregiver_training_progress` includes `UNIQUE(caregiver_id, module_id)` to prevent duplicate progress rows for the same caregiver and module.
- [ ] `state_code` has a check constraint restricting values to `'GA'`, `'IN'`, `'FL'`, `'ALL'`.
- [ ] RLS policies allow authenticated users to read active modules (`is_active = true`).
- [ ] RLS policies prevent a caregiver from selecting or updating another caregiver's progress records.

## Do NOT
- Do NOT insert module seed data into this migration file (seed content belongs in separate test seeds).
- Do NOT write application code, Express routers, or frontend components in this task.
- Do NOT create triggers or stored procedures for PDF generation in PostgreSQL.
- Do NOT alter or drop existing tables from prior migrations.
