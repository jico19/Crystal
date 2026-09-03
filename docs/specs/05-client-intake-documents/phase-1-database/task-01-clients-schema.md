# Task 01: Create `clients` and `client_documents` database schema

**Spec:** `05-client-intake-documents` | **Phase:** 1-Database | **Task:** 01

## Prerequisites
- `public.organizations` table must already exist (referenced via FK).
- `auth.users` table must exist (Supabase Auth — referenced for `assigned_rn_id` and `uploaded_by`).
- `uuid-ossp` extension must be enabled (`uuid_generate_v4()`).

## Context
This migration creates the two core tables for client intake: `clients` (demographics, payer, care needs) and `client_documents` (S3-backed file vault). Both tables are scoped to `org_id` for multi-tenancy and protected by Row Level Security so that staff only see records belonging to their own organisation. All subsequent API and frontend tasks depend on this schema existing.

## Stack & Files
- **Layer:** Database Migration (SQL)
- **Create:** `db_schema/migrations/005_clients_and_documents.sql` — full DDL for enums, tables, indexes, and RLS policies

## Deliverable
A single idempotent SQL migration file that creates the `client_status_type` and `payer_type` enums, the `clients` table, the `client_documents` table, all indexes, and RLS policies so that authenticated staff can only access rows whose `org_id` matches their JWT `app_metadata.org_id` (super_admin bypasses).

## Inputs
N/A — this is a DDL migration; no runtime inputs.

## Outputs
N/A — schema objects created in the database.

## Schema Specification

### Enum: `client_status_type`
Values: `inquiry`, `intake_pending`, `assessment_scheduled`, `active`, `on_hold`, `discharged`

### Enum: `payer_type`
Values: `medicaid_waiver`, `private_pay`, `va_community_care`, `long_term_care_insurance`, `commercial_insurance`

### Table: `public.clients`
| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, default `uuid_generate_v4()` |
| `org_id` | UUID | NOT NULL, FK → `organizations(id)` ON DELETE RESTRICT |
| `state_code` | VARCHAR(2) | NOT NULL, CHECK IN ('GA','IN','FL') |
| `status` | `client_status_type` | NOT NULL, DEFAULT `inquiry` |
| `first_name` | VARCHAR(100) | NOT NULL |
| `middle_name` | VARCHAR(100) | nullable |
| `last_name` | VARCHAR(100) | NOT NULL |
| `dob` | DATE | NOT NULL |
| `gender` | VARCHAR(20) | nullable |
| `ssn_last4` | VARCHAR(4) | nullable |
| `medicaid_id` | VARCHAR(50) | nullable |
| `primary_phone` | VARCHAR(20) | NOT NULL |
| `service_address` | JSONB | NOT NULL — `{ street, apt, city, state, zip, gate_code }` |
| `emergency_contacts` | JSONB | NOT NULL, DEFAULT `'[]'` — array of `{ name, relationship, phone, is_primary, has_poa }` |
| `primary_physician` | JSONB | NOT NULL, DEFAULT `'{}'` — `{ name, practice, phone, fax, npi }` |
| `care_needs` | JSONB | NOT NULL, DEFAULT `'{}'` — `{ adls: [], iadls: [], allergies: [], diagnoses: [] }` |
| `primary_payer` | `payer_type` | NOT NULL, DEFAULT `private_pay` |
| `payer_details` | JSONB | DEFAULT `'{}'` — `{ policy_number, group_number, case_manager_name, case_manager_phone }` |
| `assigned_rn_id` | UUID | nullable, FK → `auth.users(id)` |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

### Table: `public.client_documents`
| Column | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, default `uuid_generate_v4()` |
| `client_id` | UUID | NOT NULL, FK → `clients(id)` ON DELETE CASCADE |
| `org_id` | UUID | NOT NULL, FK → `organizations(id)` ON DELETE RESTRICT |
| `doc_type` | VARCHAR(100) | NOT NULL — e.g. `physician_orders_485`, `rn_assessment`, `service_agreement`, `insurance_card`, `poa_legal` |
| `file_storage_path` | TEXT | NOT NULL |
| `file_name` | VARCHAR(255) | NOT NULL |
| `file_size_bytes` | BIGINT | NOT NULL |
| `mime_type` | VARCHAR(100) | NOT NULL |
| `effective_date` | DATE | nullable |
| `expiration_date` | DATE | nullable |
| `uploaded_by` | UUID | nullable, FK → `auth.users(id)` |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

### Indexes
- `idx_clients_org_status` ON `clients(org_id, status)`
- `idx_clients_state` ON `clients(state_code)`
- `idx_client_docs_client` ON `client_documents(client_id)`

### RLS Policies
- **`clients`**: `FOR ALL TO authenticated` — allow if `role = 'super_admin'` OR `org_id = JWT app_metadata.org_id`.
- **`client_documents`**: same pattern as above.

## Acceptance Criteria
- [ ] Migration runs without errors on a clean database with `organizations` and `auth.users` present.
- [ ] `INSERT` into `clients` with `org_id` not matching the JWT `app_metadata.org_id` is blocked by RLS (non-super_admin user).
- [ ] `INSERT` into `clients` with a `state_code` outside `('GA','IN','FL')` raises a CHECK constraint violation.
- [ ] `client_documents` rows are CASCADE-deleted when the parent `clients` row is deleted.
- [ ] All three indexes are visible in `pg_indexes`.

## Do NOT
- Do not create application-level code (TypeScript, routes) in this task.
- Do not add columns or tables beyond what is specified above.
- Do not use `SERIAL` or `INTEGER` primary keys — use UUID throughout.
- Do not drop or alter any pre-existing tables; use `CREATE TABLE IF NOT EXISTS` and `CREATE TYPE IF NOT EXISTS` guards.
