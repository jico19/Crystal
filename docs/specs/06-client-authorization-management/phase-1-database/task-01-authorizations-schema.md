# Task 01: Client Prior Authorizations Schema & RLS
**Spec:** `06-client-authorization-management` | **Phase:** 1-Database | **Task:** 01

## Prerequisites
- [x] `organizations` table exists
- [x] `clients` table exists (Spec 05)

## Context
Medicaid and private insurance prior authorizations specify procedure codes (e.g. T1019, S5125), start/end dates, total authorized units (1 unit = 15 mins), and weekly hour caps. This migration creates the `client_authorizations` table and PostgreSQL RLS policies.

## Stack & Files
- **Layer:** Database Migration
- **Create:** `db_schema/migrations/06_client_authorizations.sql`

## Deliverable
A SQL migration file creating the `auth_status_type` enum (`active`, `expiring_soon`, `exhausted`, `expired`, `renewal_submitted`, `closed`), the `client_authorizations` table, foreign keys to `clients(id)` and `organizations(id)`, performance indexes on `(client_id)` and `(end_date, status)`, and RLS policies enforcing tenant isolation by `org_id`.

## Inputs
- Table DDL SQL definition

## Outputs
- PostgreSQL table `public.client_authorizations` with Row-Level Security enabled

## Acceptance Criteria
- [ ] Enum `auth_status_type` created with all 6 status values
- [ ] Table `client_authorizations` has foreign keys to `public.clients(id)` ON DELETE CASCADE and `public.organizations(id)` ON DELETE RESTRICT
- [ ] Column `total_units_used` defaults to `0.00`
- [ ] Index `idx_auth_client` created on `client_id`
- [ ] Index `idx_auth_dates_status` created on `(end_date, status)`
- [ ] RLS policy restricts staff queries to their authorized `org_id`

## Do NOT
- Do not add billing EDI claims tables in this migration
- Do not grant unauthenticated access to authorizations
