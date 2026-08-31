# Feature Specification: Admin Command Center & State Reporting

## 1. Executive Summary & Scope

### 1.1 Goal
Provide a centralized command center for executive leadership and state directors to monitor KPIs, caregiver compliance metrics, active client rosters, pending onboarding queues, and export state-ready regulatory compliance audit packets.

### 1.2 Problem Statement
Executive leadership lacks a consolidated single-pane-of-glass dashboard across Georgia (*With Open Hands*) and Indiana (*Cherish Open Arms*). Compiling audit reports for state surveyors currently takes days of manual file gathering.

### 1.3 Scope Boundaries
- **In-Scope:**
  - Executive Multi-State Overview (State switcher toggle: All States vs. GA vs. IN).
  - Key KPI widgets: Active Caregivers, Compliant %, Pending Applications, Active Clients, Units Authorized vs. Rendered.
  - Actionable Work Queues: Document Review Queue, Application Review Queue, Expiring Authorizations.
  - 1-Click State Audit Report CSV/PDF Exporter.
- **Out-of-Scope:**
  - Direct integration with QuickBooks/payroll ledger (CSV export provided).

---

## 2. PostgreSQL Database Views & Schema

```sql
-- Aggregated State KPI Materialized View (Refreshed Hourly)
CREATE OR REPLACE VIEW public.view_admin_state_kpis AS
SELECT
    o.id AS org_id,
    o.state_code,
    o.name AS organization_name,
    COUNT(DISTINCT cp.id) FILTER (WHERE cp.application_status = 'approved') AS active_caregivers_count,
    COUNT(DISTINCT cp.id) FILTER (WHERE cp.application_status = 'submitted') AS pending_applications_count,
    COUNT(DISTINCT cd.id) FILTER (WHERE cd.verification_status = 'under_review') AS pending_document_reviews_count,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') AS active_clients_count,
    COUNT(DISTINCT ca.id) FILTER (WHERE ca.status = 'expiring_soon') AS expiring_authorizations_count
FROM public.organizations o
LEFT JOIN public.caregiver_profiles cp ON cp.org_id = o.id
LEFT JOIN public.caregiver_documents cd ON cd.org_id = o.id
LEFT JOIN public.clients c ON c.org_id = o.id
LEFT JOIN public.client_authorizations ca ON ca.org_id = o.id
GROUP BY o.id, o.state_code, o.name;

-- Security for Views
ALTER VIEW public.view_admin_state_kpis OWNER TO postgres;
```

---

## 3. TypeScript & Zod Validation Schemas

```typescript
import { z } from 'zod';

export const AdminKpiResponseSchema = z.object({
  org_id: z.string().uuid(),
  state_code: z.enum(['GA', 'IN', 'FL']),
  organization_name: z.string(),
  active_caregivers_count: z.number(),
  pending_applications_count: z.number(),
  pending_document_reviews_count: z.number(),
  active_clients_count: z.number(),
  expiring_authorizations_count: z.number(),
});

export type AdminKpiResponse = z.infer<typeof AdminKpiResponseSchema>;
```

---

## 4. Server Actions & API Endpoint Specifications

### 4.1 Server Action: `getAdminDashboardMetrics`
```typescript
'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function getAdminDashboardMetrics(selectedState?: 'GA' | 'IN' | 'ALL') {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  let query = supabase.from('view_admin_state_kpis').select('*');
  if (selectedState && selectedState !== 'ALL') {
    query = query.eq('state_code', selectedState);
  }

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
```

---

## 5. UI/UX & Component Architecture

### 5.1 Component Tree
```
src/app/(admin)/dashboard/
├── page.tsx                           # Master Command Center (RSC)
├── StateFilterTabs.tsx                # [ All States ] [ Georgia - WOH ] [ Indiana - COA ]
├── MetricCardGrid.tsx                 # 4-Up KPI Grid with Delta % Indicators
├── UrgentActionQueue.tsx              # Tabs: [ Documents (5) ] [ Applications (3) ] [ Authorizations (2) ]
└── ComplianceAuditExporter.tsx        # "Export State Survey Audit Packet (CSV/ZIP)"
```

---

## 6. Background Automation & Agent Triggers

- **Trigger:** Nightly Summary Dispatch (`0 6 * * *`)
- **Agent Integration:** `Agent-Compliance`
- **Workflow:** Compiles daily operational digest and delivers executive summary email to agency leadership.

---

## 7. Edge Cases & Failure Recovery Matrix

| Failure Scenario | Root Cause | System Response & Mitigation |
| :--- | :--- | :--- |
| **Cross-Tenant Coordinator Access** | Coordinator attempts viewing out-of-state metrics | RLS enforces tenant boundary; UI automatically disables multi-state toggle for single-state coordinators. |

---

## 8. Acceptance Test Suite (Gherkin Syntax)

```gherkin
Feature: Admin Command Center Reporting

  Scenario: Executive views consolidated multi-state KPIs
    Given a logged in Super Admin
    When viewing the master dashboard
    Then KPI metrics aggregate data across both Georgia and Indiana organizations
    And clicking "Georgia" filters the queues exclusively to With Open Hands
```
