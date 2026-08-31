# Feature Specification: Role-Based Access Control (RBAC), Security & HIPAA Compliance

## 1. Executive Summary & Scope

### 1.1 Goal
Establish a zero-trust, HIPAA-compliant security architecture enforcing granular Role-Based Access Control (RBAC), multi-tenant Row-Level Security (RLS), field-level PII encryption, time-limited presigned media tokens, and immutable audit trails across all state agencies.

### 1.2 Problem Statement
Handling Protected Health Information (PHI) and caregiver PII (SSNs, background reports, medical exams) requires airtight security. Without strict database-level RLS and audit trails, improper cross-tenant data access or unauthorized record inspections could trigger severe HIPAA OCR violation fines.

### 1.3 Scope Boundaries
- **In-Scope:**
  - 5 System Roles: `super_admin`, `agency_admin`, `care_coordinator`, `registered_nurse`, `caregiver`.
  - Multi-tenant tenant boundary isolation (Georgia vs. Indiana vs. Florida).
  - AES-256 / AWS KMS encryption at rest and TLS 1.3 in transit.
  - Comprehensive immutable audit logging table for all PHI/PII queries.
- **Out-of-Scope:**
  - Hardware biometric physical security access.

---

## 2. PostgreSQL Database Schema (DDL) & RLS Policies

```sql
-- System Roles Enum
CREATE TYPE user_role_type AS ENUM (
    'super_admin',
    'agency_admin',
    'care_coordinator',
    'registered_nurse',
    'caregiver'
);

-- User Profiles & Role Assignment Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.organizations(id) ON DELETE RESTRICT,
    role user_role_type NOT NULL DEFAULT 'caregiver',
    state_code VARCHAR(2) CHECK (state_code IN ('GA', 'IN', 'FL', 'ALL')),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    last_sign_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comprehensive Security Audit Log (Immutable)
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- 'AUTH_LOGIN', 'AUTH_MFA_CHALLENGE', 'PHI_ACCESS', 'PII_DECRYPT', 'RECORD_MUTATION'
    resource_type VARCHAR(100) NOT NULL, -- 'caregiver_profiles', 'clients', 'caregiver_documents'
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_role ON public.user_profiles(org_id, role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_created ON public.security_audit_logs(event_type, created_at DESC);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- User Profiles RLS
CREATE POLICY "Users read own profile"
ON public.user_profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin');

-- Audit Logs RLS: Strict Append-Only for Authenticated Users; Read-Only for Super Admins
CREATE POLICY "System insert audit logs"
ON public.security_audit_logs FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Super admin read audit logs"
ON public.security_audit_logs FOR SELECT
TO authenticated
USING (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin');
```

---

## 3. TypeScript & Zod Validation Schemas

```typescript
import { z } from 'zod';

export const UserRoleSchema = z.enum([
  'super_admin',
  'agency_admin',
  'care_coordinator',
  'registered_nurse',
  'caregiver',
]);

export const RolePermissionMatrix = {
  super_admin: ['*'],
  agency_admin: ['read:all_state', 'write:state_caregivers', 'write:state_clients', 'export:state_reports'],
  care_coordinator: ['read:state_caregivers', 'write:state_caregivers', 'read:state_clients', 'write:state_intakes'],
  registered_nurse: ['read:assigned_clients', 'write:clinical_assessments'],
  caregiver: ['read:own_profile', 'write:own_profile', 'read:assigned_training'],
} as const;
```

---

## 4. Server Actions & Security Middleware

### 4.1 Server Guard: `enforceRole`
```typescript
'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function enforceRole(allowedRoles: string[]) {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('401: Unauthenticated');
  }

  const role = user.app_metadata?.role || 'caregiver';
  if (!allowedRoles.includes(role) && role !== 'super_admin') {
    throw new Error('403: Forbidden - Insufficient Permissions');
  }

  return user;
}
```

---

## 5. UI/UX & Component Architecture

### 5.1 Component Tree
```
src/app/(admin)/settings/
├── rbac/
│   ├── page.tsx                       # Role & Permissions Administration
│   ├── UserRoleAssignmentTable.tsx    # List staff & toggle roles / state assignments
│   └── AuditLogViewer.tsx             # Filterable security log search table
```

---

## 6. Background Automation & Agent Triggers

- **Trigger:** Failed login threshold exceeded (5 consecutive failed attempts).
- **Agent Integration:** `Agent-Compliance`
- **Workflow:** Temporarily locks account for 15 minutes, writes `AUTH_LOCKOUT` audit entry, and sends security alert email to user.

---

## 7. Edge Cases & Failure Recovery Matrix

| Failure Scenario | Root Cause | System Response & Mitigation |
| :--- | :--- | :--- |
| **Token Tampering / Role Injection** | Malicious client alters JWT payload | Supabase PostgREST verifies cryptographic signature against secret; invalid JWT rejected at API layer. |
| **Cross-State Record Access** | Staff queries URL with out-of-state ID | PostgreSQL Row-Level Security evaluates `org_id` and returns 0 rows (404 Not Found), preventing data exposure. |

---

## 8. Acceptance Test Suite (Gherkin Syntax)

```gherkin
Feature: RBAC & Security Boundaries

  Scenario: Caregiver attempts accessing client medical records
    Given a logged in user with role "caregiver"
    When the user sends a GET request to "/api/clients"
    Then the system returns HTTP status 403 Forbidden
    And a "SECURITY_VIOLATION" entry is recorded in the audit log

  Scenario: Agency coordinator cannot view out-of-state caregiver records
    Given a coordinator assigned to Georgia ("With Open Hands")
    When querying caregiver profiles
    Then only records tagged with Georgia org_id are returned
    And Indiana records are completely omitted by RLS
```
