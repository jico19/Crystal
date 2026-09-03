# Task 01: Create Organizations & Public Inquiries Schema

**Spec:** `01-multi-state-website-routing` | **Phase:** 1-Database | **Task:** 01

## Prerequisites
- PostgreSQL database is provisioned and accessible via `apps/api/src/db/` connection pool.
- `uuid-ossp` extension available (or migration enables it).

## Context
This task creates the foundational multi-tenancy tables that every other task in this spec depends on. `organizations` stores one row per state (GA/IN/FL) and holds all branding, contact, and service configuration as JSONB. `public_inquiries` captures anonymous contact form leads linked to an organization. Both tables have RLS policies that allow public reads of org data and anonymous inserts of leads while restricting mutations to authenticated staff.

## Stack & Files
- **Layer:** Database Migration
- **Create:** `db_schema/migrations/001_organizations_and_public_inquiries.sql` — DDL for both tables, indexes, and RLS policies

## Deliverable
A single idempotent SQL migration file that creates `public.organizations`, `public.public_inquiries`, all indexes, enables RLS, and applies the four RLS policies (public org read, super_admin org write, anonymous inquiry insert, staff inquiry read/update).

## Inputs
None — this is a DDL migration with no runtime inputs.

## Outputs
After applying the migration:
- `organizations` table exists with columns: `id`, `name`, `state_code` (CHECK IN 'GA','IN','FL'), `primary_domain` (UNIQUE), `subdomains` (TEXT[]), `license_number`, `contact_phone`, `contact_email`, `emergency_phone`, `office_address` (JSONB), `office_hours`, `branding_theme` (JSONB), `enabled_services` (JSONB), `is_active`, `created_at`, `updated_at`.
- `public_inquiries` table exists with columns: `id`, `org_id` (FK → organizations), `state_code`, `full_name`, `email`, `phone`, `inquiry_type` (CHECK IN 'caregiver_inquiry','client_care_inquiry','general_question'), `message`, `source_url`, `ip_address` (INET), `status` (CHECK IN 'new','contacted','converted','archived', DEFAULT 'new'), `notes`, `created_at`, `updated_at`.
- Four indexes: `idx_organizations_state_code`, `idx_organizations_primary_domain`, `idx_public_inquiries_org_status`, `idx_public_inquiries_created_at`.

## Acceptance Criteria
- [ ] Running the migration twice (idempotent via `IF NOT EXISTS`) produces no errors.
- [ ] An anonymous DB session can `SELECT` from `organizations` where `is_active = true` but cannot `INSERT`.
- [ ] An anonymous DB session can `INSERT` into `public_inquiries` but cannot `SELECT`.
- [ ] An authenticated session with `role = 'super_admin'` in `app_metadata` can `INSERT`/`UPDATE`/`DELETE` organizations.
- [ ] An authenticated session with a matching `org_id` in `app_metadata` can `SELECT` and `UPDATE` their tenant's inquiries only.

## Do NOT
- Do not create any application server code, Zod schemas, or Express routes in this task.
- Do not seed organization data (Georgia/Indiana rows) — that belongs in a separate seed file.
- Do not add the `caregiver_profiles` table — that is Task 01 of Spec 02.
- Do not modify existing tables or extensions beyond enabling `uuid-ossp`.
