# Task 01: Create Caregiver Profiles Schema & RLS Policies

**Spec:** `02-caregiver-application-onboarding` | **Phase:** 1-Database | **Task:** 01

## Prerequisites
- Migration `001_organizations_and_public_inquiries.sql` applied (`public.organizations` table exists).
- `auth.users` table exists in the Supabase / PostgreSQL database.
- `uuid-ossp` extension enabled.

## Context
This task creates the foundational data model for the caregiver application and onboarding funnel. It establishes the `caregiver_status_type` and `onboarding_step_status_type` enums, the `caregiver_profiles` table, performance indexes, and Row-Level Security (RLS) policies. The schema stores multi-step wizard data in structured JSONB columns, tracks onboarding checklist milestones, and enforces tenant isolation so caregivers can only access their own profile while coordinators and admins can review profiles across their tenant organization.

## Stack & Files
- **Layer:** Database Migration
- **Create:** `db_schema/migrations/002_caregiver_profiles.sql` — SQL migration file containing enums, DDL, indexes, and RLS policies

## Deliverable
A single idempotent SQL migration file that creates `caregiver_status_type`, `onboarding_step_status_type`, `public.caregiver_profiles`, three indexes, enables RLS, and creates policies granting caregivers self-access and staff role-based access.

## Inputs
None — this is a DDL migration with no runtime inputs.

## Outputs
After applying the migration:
- `caregiver_status_type` enum exists with values: `'draft'`, `'submitted'`, `'under_review'`, `'additional_info_requested'`, `'approved'`, `'rejected'`, `'archived'`.
- `onboarding_step_status_type` enum exists with values: `'not_started'`, `'in_progress'`, `'submitted'`, `'verified'`, `'rejected'`.
- `caregiver_profiles` table exists with columns:
  - `id` (UUID, PK, default `uuid_generate_v4()`)
  - `user_id` (UUID, NOT NULL, REFERENCES `auth.users(id)` ON DELETE CASCADE, UNIQUE)
  - `org_id` (UUID, NOT NULL, REFERENCES `public.organizations(id)` ON DELETE RESTRICT)
  - `state_code` (VARCHAR(2), NOT NULL, CHECK IN `'GA'`, `'IN'`, `'FL'`)
  - `application_status` (`caregiver_status_type`, NOT NULL, DEFAULT `'draft'`)
  - `application_step` (INT, NOT NULL, DEFAULT 1, CHECK BETWEEN 1 AND 5)
  - `personal_info` (JSONB, NOT NULL, DEFAULT `'{}'::jsonb`)
  - `positions_applied` (TEXT[], NOT NULL, DEFAULT `'{}'`)
  - `availability` (JSONB, NOT NULL, DEFAULT `'{}'::jsonb`)
  - `experience_history` (JSONB, NOT NULL, DEFAULT `'[]'::jsonb`)
  - `professional_licenses` (JSONB, NOT NULL, DEFAULT `'[]'::jsonb`)
  - `references` (JSONB, NOT NULL, DEFAULT `'[]'::jsonb`)
  - `legal_disclosures` (JSONB, NOT NULL, DEFAULT `'{}'::jsonb`)
  - `onboarding_checklist` (JSONB, NOT NULL, DEFAULT `'{"application_form": "in_progress", "id_documents": "not_started", "background_check": "not_started", "tb_physical": "not_started", "in_service_orientation": "not_started", "direct_deposit_w4": "not_started", "final_admin_approval": "not_started"}'::jsonb`)
  - `assigned_coordinator_id` (UUID, REFERENCES `auth.users(id)` ON DELETE SET NULL)
  - `rejection_reason` (TEXT)
  - `submitted_at` (TIMESTAMPTZ)
  - `approved_at` (TIMESTAMPTZ)
  - `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
  - `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- Indexes: `idx_caregiver_profiles_user_id`, `idx_caregiver_profiles_org_status`, `idx_caregiver_profiles_state_code`.
- RLS enabled with policies:
  - `SELECT`: `user_id = auth.uid() OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('coordinator', 'admin', 'super_admin')`
  - `UPDATE`: `user_id = auth.uid() OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('coordinator', 'admin', 'super_admin')`
  - `INSERT`: `user_id = auth.uid()`

## Acceptance Criteria
- [ ] Running the migration twice (idempotent via `IF NOT EXISTS` / `DO $$` enum checks) produces no errors.
- [ ] An authenticated user can `SELECT`, `INSERT`, and `UPDATE` their own profile where `user_id = auth.uid()`.
- [ ] An authenticated user cannot `SELECT` or `UPDATE` a profile belonging to another user (`user_id != auth.uid()`).
- [ ] A user with `role IN ('coordinator', 'admin', 'super_admin')` in `app_metadata` can `SELECT` and `UPDATE` profiles across their tenant.
- [ ] Inserting a second record with the same `user_id` fails with a unique constraint violation.

## Do NOT
- Do NOT implement pgcrypto encryption functions in this task (deferred per spec).
- Do NOT write Express routes, services, or controllers in this task.
- Do NOT create tables for document uploads (`caregiver_documents` belongs in Spec 03).
- Do NOT modify the `organizations` or `auth.users` tables.
