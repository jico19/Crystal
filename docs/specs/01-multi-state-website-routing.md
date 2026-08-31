# Feature Specification: Multi-State Website & Portal Routing

## 1. Executive Summary & Scope

### 1.1 Goal
Provide a unified web application serving distinct public-facing website experiences and portal entry points for **Georgia (With Open Hands)** and **Indiana (Cherish Open Arms)**, built on a shared design system that dynamically adapts branding and content based on state context, while architecturally prepared for rapid Florida (FL) expansion.

### 1.2 Problem Statement
Currently, the client operates fragmented website assets on GoDaddy across separate domains. Maintaining separate codebases multiplies hosting expenses, complicates compliance updates, and prevents unified lead tracking. A single Next.js 14+ codebase must dynamically resolve incoming domains/paths, inject state-specific branding tokens, route inquiries with strict tenant isolation, and comply with the $100–$200/month infrastructure budget.

### 1.3 Scope Boundaries
- **In-Scope:**
  - Multi-domain host resolution (`withopenhands.com`, `cherishopenarms.com`, `app.crystalhomecare.com`, and staging path aliases `/ga`, `/in`).
  - Dynamic CSS variable injection for brand tokens (Georgia deep teal/gold vs. Indiana navy/warm amber).
  - State switching header dropdown preserving route intent.
  - SSR public marketing pages (Home, Services, About, Careers/Apply CTA, Client Referral CTA, Contact).
  - Public lead capture writing to PostgreSQL with instant SES email dispatch.
- **Out-of-Scope:**
  - Florida marketing content rollout (database schema supports FL, but assets deferred).
  - Native mobile deep linking.

---

## 2. PostgreSQL Database Schema (DDL) & RLS Policies

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations / State Tenants Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    state_code VARCHAR(2) NOT NULL UNIQUE CHECK (state_code IN ('GA', 'IN', 'FL')),
    primary_domain VARCHAR(255) NOT NULL UNIQUE,
    subdomains TEXT[] DEFAULT '{}',
    license_number VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    emergency_phone VARCHAR(20),
    office_address JSONB NOT NULL, -- { street, city, state, zip }
    office_hours VARCHAR(255) NOT NULL DEFAULT 'Mon-Fri 8:30 AM - 5:00 PM EST',
    branding_theme JSONB NOT NULL,  -- { primary, secondary, accent, logo_url, favicon_url, hero_headline, hero_subheading }
    enabled_services JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ slug, title, description, icon }]
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Public Contact & Lead Inquiries Table
CREATE TABLE IF NOT EXISTS public.public_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    state_code VARCHAR(2) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    inquiry_type VARCHAR(50) NOT NULL CHECK (inquiry_type IN ('caregiver_inquiry', 'client_care_inquiry', 'general_question')),
    message TEXT NOT NULL,
    source_url VARCHAR(500) NOT NULL,
    ip_address INET,
    status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'archived')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast domain lookups and lead queries
CREATE INDEX IF NOT EXISTS idx_organizations_state_code ON public.organizations(state_code);
CREATE INDEX IF NOT EXISTS idx_organizations_primary_domain ON public.organizations(primary_domain);
CREATE INDEX IF NOT EXISTS idx_public_inquiries_org_status ON public.public_inquiries(org_id, status);
CREATE INDEX IF NOT EXISTS idx_public_inquiries_created_at ON public.public_inquiries(created_at DESC);

-- Enable Row-Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_inquiries ENABLE ROW LEVEL SECURITY;

-- Organizations RLS Policies:
-- 1. Public can read active organization profiles (for SSR theme & content)
CREATE POLICY "Public read active organizations" 
ON public.organizations FOR SELECT 
USING (is_active = true);

-- 2. Super admins can mutate organization settings
CREATE POLICY "Super admin full access on organizations"
ON public.organizations FOR ALL
TO authenticated
USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
);

-- Public Inquiries RLS Policies:
-- 1. Anyone (anonymous public) can submit a lead
CREATE POLICY "Anonymous public lead insertion"
ON public.public_inquiries FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2. Staff can view leads matching their tenant or super admin
CREATE POLICY "Staff read tenant inquiries"
ON public.public_inquiries FOR SELECT
TO authenticated
USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
    OR org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
);

-- 3. Staff can update status of tenant inquiries
CREATE POLICY "Staff update tenant inquiries"
ON public.public_inquiries FOR UPDATE
TO authenticated
USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
    OR org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
)
WITH CHECK (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'super_admin'
    OR org_id = ((auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
);
```

---

## 3. TypeScript & Zod Validation Schemas

```typescript
import { z } from 'zod';

// ==========================================
// Organization & Theme Schemas
// ==========================================
export const OfficeAddressSchema = z.object({
  street: z.string().min(3, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().length(2, 'State code must be 2 characters'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Valid US ZIP code required'),
});

export const BrandingThemeSchema = z.object({
  primary_color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color'),
  secondary_color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color'),
  accent_color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color'),
  logo_url: z.string().url('Invalid logo URL'),
  favicon_url: z.string().url('Invalid favicon URL'),
  hero_headline: z.string().min(5, 'Hero headline is required'),
  hero_subheading: z.string().min(10, 'Hero subheading is required'),
});

export const EnabledServiceSchema = z.object({
  slug: z.string().min(2),
  title: z.string().min(3),
  description: z.string().min(10),
  icon_name: z.string().min(2),
});

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  state_code: z.enum(['GA', 'IN', 'FL']),
  primary_domain: z.string(),
  subdomains: z.array(z.string()),
  license_number: z.string().min(1),
  contact_phone: z.string().min(10),
  contact_email: z.string().email(),
  emergency_phone: z.string().optional(),
  office_address: OfficeAddressSchema,
  office_hours: z.string(),
  branding_theme: BrandingThemeSchema,
  enabled_services: z.array(EnabledServiceSchema),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

// ==========================================
// Public Inquiry / Lead Schemas
// ==========================================
export const CreatePublicInquirySchema = z.object({
  org_id: z.string().uuid('Invalid organization ID'),
  state_code: z.enum(['GA', 'IN', 'FL']),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^\+?1?\s*\(?-*\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4}$/, 'Invalid US phone number'),
  inquiry_type: z.enum(['caregiver_inquiry', 'client_care_inquiry', 'general_question'], {
    required_error: 'Please select an inquiry type',
  }),
  message: z.string().min(10, 'Message must contain at least 10 characters').max(2000, 'Message cannot exceed 2000 characters'),
  source_url: z.string().url(),
  honeypot: z.string().max(0, 'Spam detected').optional(), // Anti-spam hidden field
});

export type CreatePublicInquiryInput = z.infer<typeof CreatePublicInquirySchema>;
```

---

## 4. Server Actions & Middleware Specifications

### 4.1 Next.js Edge Middleware (`middleware.ts`)
- **Route Matcher:** `['/((?!api|_next/static|_next/image|favicon.ico).*)']`
- **Logic:**
  1. Read incoming `req.headers.get('host')`.
  2. Map `withopenhands.com` $\rightarrow$ set `x-state-code: GA`, rewrite path to `/(public)/ga${pathname}`.
  3. Map `cherishopenarms.com` $\rightarrow$ set `x-state-code: IN`, rewrite path to `/(public)/in${pathname}`.
  4. If requesting staging domain (e.g. `crystalhomecare.com/ga/...`), rewrite directly to `/(public)/ga/...`.
  5. Inject header `x-matched-state` for downstream React Server Components.

### 4.2 Server Action: `submitPublicInquiry`
```typescript
'use server';

import { CreatePublicInquirySchema, CreatePublicInquiryInput } from '@/lib/schemas/routing';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendLeadNotificationEmail } from '@/lib/services/ses-mailer';
import { headers } from 'next/headers';

export interface ActionResponse<T = null> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function submitPublicInquiry(rawInput: CreatePublicInquiryInput): Promise<ActionResponse<{ inquiryId: string }>> {
  // 1. Zod schema validation
  const validation = CreatePublicInquirySchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { honeypot, ...payload } = validation.data;
  if (honeypot && honeypot.length > 0) {
    return { success: true, data: { inquiryId: 'noop' } }; // Silent drop for bots
  }

  const headerList = headers();
  const ipAddress = headerList.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

  const supabase = createServerSupabaseClient();

  // 2. Insert record into database
  const { data, error } = await supabase
    .from('public_inquiries')
    .insert({
      org_id: payload.org_id,
      state_code: payload.state_code,
      full_name: payload.full_name,
      email: payload.email,
      phone: payload.phone,
      inquiry_type: payload.inquiry_type,
      message: payload.message,
      source_url: payload.source_url,
      ip_address: ipAddress,
      status: 'new',
    })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: 'Database transaction failed. Please try again later.' };
  }

  // 3. Dispatch async notification (SES)
  try {
    await sendLeadNotificationEmail({
      inquiryId: data.id,
      orgId: payload.org_id,
      fullName: payload.full_name,
      email: payload.email,
      phone: payload.phone,
      inquiryType: payload.inquiry_type,
      message: payload.message,
      stateCode: payload.state_code,
    });
  } catch (mailError) {
    console.error('[SES Lead Mailer Error]', mailError);
    // Note: Do not fail client response if mail delivery fails; record is persisted in DB
  }

  return { success: true, data: { inquiryId: data.id } };
}
```

---

## 5. UI/UX & Component Architecture

### 5.1 Component Hierarchy
```
src/app/(public)/[state]/
├── layout.tsx                     # Dynamic CSS theme injection & Root State Header
│   ├── StateHeader.tsx            # Sticky navigation bar
│   │   ├── BrandLogo.tsx          # With Open Hands (GA) or Cherish Open Arms (IN)
│   │   ├── NavigationLinks.tsx    # Services, About, Careers, Contact
│   │   ├── StateSwitcher.tsx      # GA / IN Selector Modal / Dropdown
│   │   └── PortalLoginCTA.tsx     # Direct link to auth portal
│   ├── layout-children            # Page content
│   └── StateFooter.tsx            # State licensing, compliance badges, address
├── page.tsx                       # Homepage (Hero, Services Grid, Why Us, CTAs)
├── services/page.tsx              # Detailed services directory
├── about/page.tsx                 # Leadership, mission, and accreditation
└── contact/
    ├── page.tsx                   # Contact information & office hours
    └── ContactForm.tsx            # Interactive lead capture form
```

### 5.2 Dynamic Theme Variable Injection
The `layout.tsx` injects inline CSS custom properties based on `branding_theme`:
```tsx
<html lang="en" style={{
  '--primary': theme.primary_color,
  '--secondary': theme.secondary_color,
  '--accent': theme.accent_color,
} as React.CSSProperties}>
```

### 5.3 UI State Machine (ContactForm)
```
[ IDLE ] ──(user edits fields)──> [ DIRTY ]
   │                                  │
(click submit)                   (click submit)
   │                                  │
   ▼                                  ▼
[ VALIDATING (Zod client-side) ]
   ├──(invalid)──> [ FIELD_ERROR (inline messages) ]
   └──(valid)────> [ SUBMITTING (loading spinner, buttons disabled) ]
                      ├──(server error)──> [ SERVER_ERROR (alert banner) ]
                      └──(success)───────> [ SUCCESS (confirmation view, reset form) ]
```

---

## 6. Background Automation & Agent Triggers

- **Trigger:** Webhook / Database Trigger on `public_inquiries.INSERT`
- **Agent Integration:** `Agent-NotificationDispatcher`
- **Automated Workflow:**
  1. Form submission creates row with `status = 'new'`.
  2. Dispatcher queries coordinator emails configured for `org_id`.
  3. Formats HIPAA-compliant summary email (no client health details disclosed).
  4. If `inquiry_type = 'caregiver_inquiry'`, an auto-responder is immediately sent to the candidate with a direct link to the state-specific caregiver onboarding portal (`/(portals)/caregiver/apply`).

---

## 7. Edge Cases & Failure Recovery Matrix

| Failure Scenario | Root Cause | System Response & Mitigation |
| :--- | :--- | :--- |
| **Unknown Host Header** | Unrecognized domain or direct IP access | Middleware defaults to primary platform landing page with state selector modal. |
| **Cross-State Navigation** | User selects Indiana while reading Georgia page | System redirects to `cherishopenarms.com` (or `/in`) preserving path (e.g. `/apply`). |
| **Email Dispatch (SES) Failure** | SES rate limit or network timeout | Database write succeeds. Lead recorded in DB queue with `status = 'new'`; retry worker dispatches pending emails. |
| **Form Double-Submit** | User rapidly clicks submit button | Client disables button on first click with spinner; Server Action enforces idempotency. |
| **Bot Spam / Form Scraping** | Automated scraper fills form | Hidden honeypot field catches bots silently; Zod rejects malformed payload with generic HTTP 200 response. |

---

## 8. Acceptance Test Suite (Gherkin Syntax)

```gherkin
Feature: Multi-State Website & Portal Routing

  Scenario: Visitor visits Georgia domain
    Given a visitor enters the URL "https://withopenhands.com"
    When the page completes server rendering
    Then the page title should contain "With Open Hands"
    And the Georgia license number and Atlanta office address should be visible
    And the CSS variable "--primary" should match Georgia teal "#0F766E"
    And no Indiana branding assets should be rendered in the DOM

  Scenario: Visitor visits Indiana domain
    Given a visitor enters the URL "https://cherishopenarms.com"
    When the page completes server rendering
    Then the page title should contain "Cherish Open Arms"
    And the Indiana license number and Indianapolis office address should be visible
    And the CSS variable "--primary" should match Indiana navy "#1E3A8A"

  Scenario: Seamless state switching preserving subpath
    Given a visitor is currently viewing "https://withopenhands.com/contact"
    When the visitor selects "Indiana (Cherish Open Arms)" from the state switcher dropdown
    Then the browser redirects to "https://cherishopenarms.com/contact"
    And the contact information updates to the Indiana agency office

  Scenario: Successful public lead submission
    Given a visitor fills out the contact form with:
      | full_name     | Jane Doe                |
      | email         | jane.doe@example.com    |
      | phone         | (555) 234-5678          |
      | inquiry_type  | caregiver_inquiry       |
      | message       | Inquiring about CNA jobs|
    When the visitor clicks "Submit Inquiry"
    Then the form status should transition to "SUCCESS"
    And a record is created in "public_inquiries" with the matching "org_id"
    And the response time is less than 500ms

  Scenario: Submitting with invalid phone and empty message
    Given a visitor submits the contact form with phone "12345" and an empty message
    When the form validation executes
    Then the form should not dispatch a network request
    And inline error messages should display for "phone" and "message"
```
