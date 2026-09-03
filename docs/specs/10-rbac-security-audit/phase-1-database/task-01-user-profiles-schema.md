# Task 01: User Profiles & Security Audit Schema
**Spec:** `10-rbac-security-audit` | **Phase:** 1-Database | **Task:** 01

## Prerequisites
- [x] PostgreSQL database initialized
- [x] `organizations` table exists

## Context
Establishes the zero-trust RBAC kernel by defining system roles (`super_admin`, `agency_admin`, `care_coordinator`, `registered_nurse`, `caregiver`), `user_profiles` table, and immutable HIPAA `security_audit_logs` append-only table.

## Stack & Files
- **Layer:** Database Migration
- **Create:** `db_schema/migrations/10_rbac_user_profiles.sql`

## Deliverable
A SQL migration defining `user_role_type` enum, `user_profiles` table, `security_audit_logs` table, indexes on `(org_id, role)` and `(event_type, created_at DESC)`, and append-only RLS policies for audit logging.

## Inputs
- DDL SQL definition

## Outputs
- PostgreSQL tables `user_profiles` and `security_audit_logs`

## Acceptance Criteria
- [ ] Enum `user_role_type` created with 5 system roles
- [ ] `security_audit_logs` table has columns for `user_id`, `org_id`, `event_type`, `resource_type`, `resource_id`, `ip_address`, `user_agent`, `metadata`, `created_at`
- [ ] Audit logs RLS permits INSERT for authenticated users but restricts SELECT to `super_admin` only
- [ ] UPDATE and DELETE statements strictly forbidden on `security_audit_logs` to ensure immutability

## Do NOT
- Do not allow DELETE or UPDATE RLS policies on `security_audit_logs` — audit logs must be append-only
