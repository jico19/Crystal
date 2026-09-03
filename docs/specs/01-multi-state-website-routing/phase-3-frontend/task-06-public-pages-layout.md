# Task 06: Build Public Pages Layout (StateHeader & StateFooter)

**Spec:** `01-multi-state-website-routing` | **Phase:** 3-Frontend | **Task:** 06

## Prerequisites
- Task 04 complete: `OrgThemeContext` is implemented, injected at app root, and exposes `useOrgTheme()`.
- React Router v7 configured in both SPA projects (`apps/georgia/`, `apps/indiana/`).
- `@crystal/ui` components available (`Button`, `NavigationMenu`, `DropdownMenu`).

## Context
Each state website requires persistent header and footer navigation components that automatically reflect the tenant organization's branding and metadata. `StateHeader` displays the organization logo, primary navigation links (Home, Services, About, Contact), a state-specific phone number link, a "Careers / Apply Now" CTA button, and an optional cross-state switcher link (e.g. "Looking for Georgia?"). `StateFooter` displays the legal organization name, state license number, physical office address, contact information, service links, and copyright notice. Both components consume `useOrgTheme()` to ensure zero hardcoded state data.

## Stack & Files
- **Layer:** Vite React (applies to both `apps/georgia/src/` and `apps/indiana/src/`)
- **Create:** `apps/georgia/src/components/layout/StateHeader.tsx` — public header with logo, navigation, phone CTA, and cross-state switcher
- **Create:** `apps/georgia/src/components/layout/StateFooter.tsx` — public footer with license, address, contact, and legal links
- **Create:** `apps/georgia/src/components/layout/PublicLayout.tsx` — shell wrapping `StateHeader`, `<Outlet />`, and `StateFooter`
- **Create:** `apps/indiana/src/components/layout/StateHeader.tsx` — identical header for Indiana SPA
- **Create:** `apps/indiana/src/components/layout/StateFooter.tsx` — identical footer for Indiana SPA
- **Create:** `apps/indiana/src/components/layout/PublicLayout.tsx` — identical shell for Indiana SPA
- **Modify:** `apps/georgia/src/App.tsx` — mount `PublicLayout` as route layout for public website routes
- **Modify:** `apps/indiana/src/App.tsx` — mount `PublicLayout` as route layout for public website routes

## Deliverable
`StateHeader` and `StateFooter` layout components wrapped in a `PublicLayout` route container that dynamically consume `OrgThemeContext` to render tenant logo, license number, office address, phone number, navigation items, and cross-state switcher without any hardcoded state values.

## Inputs
```typescript
// Consumed via useOrgTheme() hook from OrgThemeContext:
interface Organization {
  id: string;
  name: string;
  state_code: 'GA' | 'IN' | 'FL';
  primary_domain: string;
  license_number: string;
  contact_phone: string;
  contact_email: string;
  emergency_phone?: string;
  office_address: {
    street: string;
    suite?: string;
    city: string;
    state: string;
    zip: string;
  };
  office_hours: string;
  branding_theme: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    logo_url: string;
    favicon_url: string;
    hero_headline: string;
    hero_subheading: string;
  };
  enabled_services: Array<{
    id: string;
    slug: string;
    title: string;
  }>;
}
```

## Outputs
- **`StateHeader`:** Responsive navigation bar with:
  - Tenant logo image (`branding_theme.logo_url`) linking to `/`.
  - Main links: "Home" (`/`), "Services" (`/services`), "About" (`/about`), "Contact" (`/contact`).
  - Phone link formatted as `tel:<contact_phone>` with phone icon.
  - "Apply Now" button styled using `--primary` linking to `/apply`.
  - Cross-state navigation link: e.g. "Visiting from Indiana? Visit Cherish Open Arms" linking to the alternate domain while preserving the current route pathname.
  - Mobile hamburger navigation sheet for screen widths < 768px.
- **`StateFooter`:** Responsive footer with:
  - Column 1: Tenant logo, short mission statement, state license display (e.g. `GA License #HFRD-12345`).
  - Column 2: Dynamic list of links generated from `enabled_services`.
  - Column 3: Physical office address, office hours, and contact email/phone.
  - Bottom bar: Copyright year with organization name, privacy policy, and terms links.
- **`PublicLayout`:** Layout shell rendering sticky `<StateHeader />`, `<main className="flex-1"><Outlet /></main>`, and `<StateFooter />`.

## Acceptance Criteria
- [ ] `StateHeader` displays the organization logo and name dynamically from `useOrgTheme()`.
- [ ] The "Call Us" link href accurately points to `tel:${org.contact_phone}`.
- [ ] The cross-state switcher points to the alternate state domain (e.g. `cherishopenarms.com` when on Georgia) and preserves the current pathname.
- [ ] `StateFooter` renders the state license number (`org.license_number`) and formatted office address from context.
- [ ] Mobile navigation toggles cleanly without layout shifts on viewports < 768px.
- [ ] Navigation uses React Router v7 (`NavLink`, `Link`, `Outlet`), with active route styling on current links.

## Do NOT
- Do NOT hardcode state names, license numbers, addresses, phone numbers, or hex colors in components.
- Do NOT use Next.js `<Link>`, `usePathname()`, or App Router conventions.
- Do NOT include admin portal navigation or authenticated caregiver portal links in these public layout components.
- Do NOT fetch data directly from the network inside these components — rely exclusively on `useOrgTheme()`.
