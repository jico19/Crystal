# Feature Specification: Client Prior Authorization & Utilization Management

## 1. Executive Summary & Scope

### 1.1 Goal
Provide proactive management, real-time unit consumption tracking, and automated expiration monitoring for Medicaid and insurance Prior Authorizations (PAs), eliminating service lapses and unbillable caregiver hours.

### 1.2 Problem Statement
Home care agencies frequently suffer revenue loss or unpaid claims when caregivers deliver care against expired or exhausted Medicaid prior authorizations. Tracking authorization periods and unit limits across spreadsheets leads to billing rejections.

### 1.3 Scope Boundaries
- **In-Scope:**
  - Authorization tracking: Authorized units, start/end dates, procedure codes (T1019, S5125, S5130), weekly hour caps.
  - Real-time unit burn-down visualizer.
  - Automated 60-day and 30-day expiration alerts to case managers and agency staff.
  - Re-authorization workflow tracking (`pending_renewal`, `submitted_to_payer`, `approved`).
- **Out-of-Scope:**
  - Direct electronic 837/835 EDI clearinghouse claims submission (Phase 1 tracks authorization caps).

---

## 2. PostgreSQL Database Schema (DDL) & RLS Policies

```sql
-- Authorization Status Enum
CREATE TYPE auth_status_type AS ENUM (
    'active',
    'expiring_soon',
    'exhausted',
    'expired',
    'renewal_submitted',
    'closed'
);

-- Client Prior Authorizations Table
CREATE TABLE IF NOT EXISTS public.client_authorizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    payer_name VARCHAR(150) NOT NULL, -- e.g. "Georgia Medicaid / CCSP", "Indiana FSSA / A&D Waiver"
    authorization_number VARCHAR(100) NOT NULL,
    procedure_code VARCHAR(20) NOT NULL, -- e.g. "T1019", "S5125", "S5130"
    service_type VARCHAR(100) NOT NULL,  -- "Personal Support Services", "Attendant Care", "Respite"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_units_authorized NUMERIC(10,2) NOT NULL, -- Typically 1 unit = 15 mins
    total_units_used NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    weekly_hours_cap NUMERIC(5,2),
    status auth_status_type NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_auth_client ON public.client_authorizations(client_id);
CREATE INDEX IF NOT EXISTS idx_auth_dates_status ON public.client_authorizations(end_date, status);

-- Enable RLS
ALTER TABLE public.client_authorizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage client authorizations"
ON public.client_authorizations FOR ALL
TO authenticated
USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
    OR org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
);
```

---

## 3. TypeScript & Zod Validation Schemas

```typescript
import { z } from 'zod';

export const ClientAuthorizationSchema = z.object({
  client_id: z.string().uuid(),
  org_id: z.string().uuid(),
  payer_name: z.string().min(2, 'Payer name is required'),
  authorization_number: z.string().min(3, 'Auth number required'),
  procedure_code: z.string().min(2, 'Procedure code (e.g. T1019) required'),
  service_type: z.string().min(2),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_units_authorized: z.number().positive('Units must be positive'),
  weekly_hours_cap: z.number().positive().optional(),
  notes: z.string().optional(),
}).refine((data) => new Date(data.end_date) > new Date(data.start_date), {
  message: 'End date must be after start date',
  path: ['end_date'],
});
```

---

## 4. Server Actions & API Endpoint Specifications

### 4.1 Server Action: `createAuthorization`
```typescript
'use server';

import { ClientAuthorizationSchema } from '@/lib/schemas/authorizations';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function createAuthorization(input: z.infer<typeof ClientAuthorizationSchema>) {
  const parsed = ClientAuthorizationSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('client_authorizations')
    .insert(parsed.data)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
```

---

## 5. UI/UX & Component Architecture

### 5.1 Component Tree
```
src/app/(portals)/admin/authorizations/
├── page.tsx                           # Master Authorization Roster & Burn-Down Meters
├── AuthorizationCard.tsx              # Unit progress bar (% consumed vs % timeline elapsed)
├── ExpirationWarningBadge.tsx         # Red (<30 days), Amber (30-60 days), Green (>60 days)
└── NewAuthorizationModal.tsx          # Creation and renewal entry dialog
```

---

## 6. Background Automation & Agent Triggers

- **Trigger:** Daily cron (`0 1 * * *`)
- **Agent Integration:** `Agent-AuthTracker`
- **Workflow:**
  1. Identifies authorizations expiring within 60 and 30 days or having $< 10\%$ remaining units.
  2. Updates status to `'expiring_soon'` or `'exhausted'`.
  3. Sends automated renewal alert to the designated client care coordinator.

---

## 7. Edge Cases & Failure Recovery Matrix

| Failure Scenario | Root Cause | System Response & Mitigation |
| :--- | :--- | :--- |
| **Units Consumed Exceeds Cap** | Over-scheduling of caregiver hours | System flags client record with red warning badge: *"Authorization Over-Utilization Alert"*. |
| **Retroactive Authorization Approval** | Medicaid back-dates approval date | System allows `start_date` in the past while preserving audit log entry of actual creation timestamp. |

---

## 8. Acceptance Test Suite (Gherkin Syntax)

```gherkin
Feature: Client Prior Authorization Tracking

  Scenario: Authorization enters 30-day warning window
    Given an active client authorization with end date 25 days from today
    When the daily Agent-AuthTracker worker runs
    Then the authorization status changes to "expiring_soon"
    And an escalation reminder is dispatched to the agency billing manager
```
