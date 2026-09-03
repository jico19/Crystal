# SPEC: Multi-State Website & Dedicated Domain Routing

## Goal
Deliver dedicated public website experiences for **Georgia** (`withopenhands.com` — *With Open Hands*) and **Indiana** (`cherishopenarms.com` — *Cherish Open Arms*), built on a shared design system with state-specific branding. Each domain resolves directly to its state content with no splash screens. A centralized Admin Portal (`/admin`) serves super administrators governing all states.

---

## Scope

### In-Scope
- Domain-to-organization resolution (`withopenhands.com` → GA, `cherishopenarms.com` → IN).
- State-specific branding tokens: GA uses Deep Teal (`#0F766E`) / Gold; IN uses Deep Navy (`#1E3A8A`) / Coral.
- Public marketing pages: Home, Services, About, Careers CTA, Contact.
- State-aware public lead capture (`public_inquiries`) with instant SES notification.
- Optional cross-state switcher link in header/footer.

### Out-of-Scope
- Mandatory state-picker splash screen on root domain.
- Florida marketing content rollout (schema supports `FL`, assets deferred).
- Native mobile apps.
- Admin Portal UI (separate spec).

---

## Architecture Overview
The frontend is a **Vite 8 + React 19 SPA** per state (`apps/georgia/` and `apps/indiana/`). On boot, each SPA calls `GET /api/v1/organizations/by-domain?domain=<host>` to retrieve its branding configuration, then injects CSS custom properties into `:root`. Contact form submissions call `POST /api/v1/inquiries`. The **Express v5 API** (`apps/api/`) handles all DB writes and SES dispatch; the frontend never touches the database directly.

---

## Data Model (Reference — no DDL here)

### `organizations` table
Stores one row per state tenant. Key columns: `state_code` (GA/IN/FL), `primary_domain`, `branding_theme` (JSONB with `primary_color`, `secondary_color`, `accent_color`, `logo_url`, `favicon_url`, `hero_headline`, `hero_subheading`), `enabled_services` (JSONB array), `office_address` (JSONB), `contact_phone`, `contact_email`, `license_number`, `is_active`.

### `public_inquiries` table
Captures public contact/lead submissions. Key columns: `org_id` (FK → organizations), `state_code`, `full_name`, `email`, `phone`, `inquiry_type` (enum: `caregiver_inquiry` | `client_care_inquiry` | `general_question`), `message`, `source_url`, `ip_address`, `status` (enum: `new` | `contacted` | `converted` | `archived`).

---

## Zod Schemas (Reference — defined in `@crystal/validation`)

| Schema | Purpose |
|---|---|
| `BrandingThemeSchema` | Validates `branding_theme` JSONB shape |
| `OrganizationSchema` | Full organization row shape |
| `CreatePublicInquirySchema` | Contact form submission, includes `honeypot` field |

---

## Edge Cases

| Failure Scenario | Root Cause | System Response |
|:---|:---|:---|
| **Unknown Host Header** | Unrecognized domain or direct IP access | API returns 404; SPA falls back to a generic landing page with state selector. |
| **Cross-State Navigation** | User selects wrong state via switcher | Browser redirects to the other state domain, preserving the current path (e.g. `/contact`). |
| **SES Dispatch Failure** | Rate limit or network timeout | DB write succeeds; lead recorded with `status = 'new'`; retry worker dispatches pending emails. |
| **Form Double-Submit** | User rapidly clicks Submit | Client disables button on first click; server enforces idempotency via single insert. |
| **Bot Spam** | Automated scraper fills form | Hidden `honeypot` field populated by bots; server silently returns `200 { success: true }` without DB write. |

---

## Acceptance Tests (Gherkin)

```gherkin
Feature: Multi-State Website & Portal Routing

  Scenario: Visitor visits Georgia domain
    Given a visitor enters the URL "https://withopenhands.com"
    When the SPA boots and fetches organization branding
    Then the page title should contain "With Open Hands"
    And the Georgia license number and Atlanta office address should be visible
    And the CSS variable "--primary" should equal "#0F766E"
    And no Indiana branding assets should be present in the DOM

  Scenario: Visitor visits Indiana domain
    Given a visitor enters the URL "https://cherishopenarms.com"
    When the SPA boots and fetches organization branding
    Then the page title should contain "Cherish Open Arms"
    And the Indiana license number and Indianapolis office address should be visible
    And the CSS variable "--primary" should equal "#1E3A8A"

  Scenario: Seamless state switching preserving subpath
    Given a visitor is currently viewing "https://withopenhands.com/contact"
    When the visitor selects "Indiana (Cherish Open Arms)" from the state switcher
    Then the browser redirects to "https://cherishopenarms.com/contact"
    And the contact information updates to the Indiana office

  Scenario: Successful public lead submission
    Given a visitor fills out the contact form with valid name, email, phone, inquiry_type, and message
    When the visitor clicks "Submit Inquiry"
    Then the form transitions to the SUCCESS state
    And a record is created in "public_inquiries" with the correct "org_id"
    And the response completes in less than 500ms

  Scenario: Submitting with invalid phone and empty message
    Given a visitor submits the contact form with phone "12345" and an empty message
    When the form runs client-side Zod validation
    Then no network request is dispatched
    And inline error messages appear for "phone" and "message"
```

---

## Background Automation (Reference)
- On `public_inquiries INSERT`: `Agent-NotificationDispatcher` emails coordinators for the matching `org_id`.
- If `inquiry_type = 'caregiver_inquiry'`: auto-responder sent to candidate with link to caregiver application portal.
