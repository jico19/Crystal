# Task 01: Create `signature_envelopes` Database Schema

**Spec:** `09-esignature-workflow` | **Phase:** 1-Database | **Task:** 01

## Prerequisites
- `public.organizations` table must already exist (FK target).
- `auth.users` table must already exist (Supabase Auth — pre-existing).
- `uuid-ossp` extension must be enabled (`uuid_generate_v4()`).

## Context
This task creates the entire database foundation for the e-signature feature. Before any API route or frontend component can function, PostgreSQL needs the `esign_envelope_status` enum type and the `signature_envelopes` table with proper constraints and Row-Level Security policies. All subsequent tasks in this spec depend on this migration being applied first.

## Stack & Files
- **Layer:** Database Migration
- **Create:** `db_schema/migrations/009_signature_envelopes.sql` — DDL for enum, table, indexes, and RLS policies

## Deliverable
A SQL migration file that creates the `esign_envelope_status` enum, the `signature_envelopes` table with all columns and FK constraints, enables RLS, and attaches one policy allowing signers and staff roles (`coordinator`, `admin`, `super_admin`) to access their own envelopes.

## Inputs
N/A — this is a DDL migration with no runtime inputs.

## Outputs
After `psql -f 009_signature_envelopes.sql` completes with no errors:
- `esign_envelope_status` enum exists with values: `draft`, `sent`, `partially_signed`, `completed`, `declined`, `voided`.
- `public.signature_envelopes` table exists with all columns listed below.
- RLS is enabled on the table.
- Policy `"Signers and Staff access envelopes"` exists.

### `signature_envelopes` Columns
| Column | Type | Constraint |
| :--- | :--- | :--- |
| `id` | UUID | PK, DEFAULT `uuid_generate_v4()` |
| `org_id` | UUID | NOT NULL, FK → `organizations.id` ON DELETE RESTRICT |
| `title` | VARCHAR(255) | NOT NULL |
| `status` | `esign_envelope_status` | NOT NULL, DEFAULT `'sent'` |
| `signer_role` | VARCHAR(50) | NOT NULL |
| `signer_user_id` | UUID | NULLABLE, FK → `auth.users.id` |
| `signer_name` | VARCHAR(255) | NOT NULL |
| `signer_email` | VARCHAR(255) | NOT NULL |
| `external_provider_id` | VARCHAR(255) | NULLABLE |
| `signed_document_storage_path` | TEXT | NULLABLE |
| `signed_document_hash` | VARCHAR(64) | NULLABLE |
| `ip_address` | INET | NULLABLE |
| `user_agent` | TEXT | NULLABLE |
| `signed_at` | TIMESTAMPTZ | NULLABLE |
| `expires_at` | TIMESTAMPTZ | NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

## Acceptance Criteria
- [ ] Running the migration twice is safe (use `IF NOT EXISTS` and `DO $$ ... IF NOT EXISTS` for the enum).
- [ ] A row inserted with `signer_user_id = NULL` succeeds (nullable FK for external signers).
- [ ] A SELECT by the signer's own `auth.uid()` returns their row; a SELECT by a different non-staff user returns 0 rows (RLS enforced).
- [ ] A user with JWT `app_metadata.role = 'admin'` can SELECT any row in the table.
- [ ] Attempting to reference a non-existent `org_id` fails with a FK violation.

## Do NOT
- Do NOT drop or replace any existing enum type if it already exists — use safe guard patterns.
- Do NOT add application-level trigger logic (updated_at triggers belong in a separate shared migration).
- Do NOT create API routes or TypeScript files in this task.
- Do NOT define RLS policies for `INSERT` or `DELETE` — the API uses a service-role connection that bypasses RLS for mutations.
