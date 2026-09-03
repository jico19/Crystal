# Task 01: Create Documents Database Schema

**Spec:** `03-caregiver-documents-credential-tracking` | **Phase:** 1-Database | **Task:** 01

## Prerequisites
- `public.caregiver_profiles` table exists (from spec 01 caregiver onboarding).
- `public.organizations` table exists.
- `auth.users` table exists (Supabase Auth).
- `uuid-ossp` extension enabled (`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`).

## Context
This task creates the entire storage layer for caregiver credential documents. Two tables are needed: `caregiver_documents` for the file metadata and verification state, and `document_audit_logs` as an immutable append-only audit trail. RLS ensures caregivers can only access their own documents while coordinators and admins retain full read/write access within their org.

## Stack & Files
- **Layer:** Database Migration
- **Create:** `db_schema/migrations/003_caregiver_documents.sql` — full DDL for enums, tables, indexes, and RLS policies

## Deliverable
A single SQL migration file that creates the `document_category_type` enum, `doc_verification_status_type` enum, `caregiver_documents` table, `document_audit_logs` table, three indexes, enables RLS on both tables, and attaches four RLS policies (caregiver SELECT, caregiver INSERT, staff UPDATE on documents; restricted INSERT on audit logs).

## Inputs
N/A — this is a schema-only migration with no runtime inputs.

## Outputs
N/A — migration applied once via `psql` or migration runner; no HTTP response.

## Acceptance Criteria
- [ ] `document_category_type` enum contains exactly 11 values matching the spec.
- [ ] `doc_verification_status_type` enum contains exactly 5 values: `pending_upload`, `under_review`, `approved`, `rejected`, `expired`.
- [ ] `caregiver_documents.file_size_bytes` is typed `BIGINT` and `mime_type` is `VARCHAR(100)`.
- [ ] `document_audit_logs.action` column has a CHECK constraint restricting values to `UPLOAD`, `VIEW_PREVIEW`, `DOWNLOAD`, `APPROVE`, `REJECT`, `EXPIRE`.
- [ ] Partial index on `expiration_date WHERE is_archived = false` exists so expiry queries are fast.
- [ ] RLS is enabled on both tables and `SELECT` policy prevents a caregiver from reading another caregiver's documents.

## Do NOT
- Do NOT add application logic, triggers, or stored procedures in this migration.
- Do NOT create any API routes or frontend files.
- Do NOT drop or alter existing tables from prior migrations.
- Do NOT hardcode any org UUIDs or user UUIDs.
