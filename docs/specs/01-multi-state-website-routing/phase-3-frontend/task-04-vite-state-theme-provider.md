# Task 04: Build Vite State Theme Provider (OrgThemeContext)

**Spec:** `01-multi-state-website-routing` | **Phase:** 3-Frontend | **Task:** 04

## Prerequisites
- Task 02 complete: `GET /api/v1/organizations/by-domain` is live and returns `OrganizationSchema`-shaped data.
- `@crystal/types` package exports the `Organization` TypeScript type.
- Both SPA projects (`apps/georgia/`, `apps/indiana/`) are bootstrapped with Vite 8 + React 19 and React Router v7.

## Context
Each state SPA must load its organization's branding before rendering any UI. This task creates a React context (`OrgThemeContext`) that fires on app boot, calls the API with the current hostname, and injects the returned branding colors as CSS custom properties on `:root`. All downstream layout components (header, footer, buttons) consume these CSS variables — they never hardcode colors. The provider also exposes the full `Organization` object so components can access contact info and enabled services.

## Stack & Files
- **Layer:** Vite React (applies to both `apps/georgia/src/` and `apps/indiana/src/`)
- **Create:** `apps/georgia/src/lib/OrgThemeContext.tsx` — React context + `OrgThemeProvider` component + `useOrgTheme()` hook
- **Create:** `apps/indiana/src/lib/OrgThemeContext.tsx` — identical copy (or symlink to shared package if monorepo supports it)
- **Modify:** `apps/georgia/src/main.tsx` — wrap `<App />` with `<OrgThemeProvider />`
- **Modify:** `apps/indiana/src/main.tsx` — wrap `<App />` with `<OrgThemeProvider />`

## Deliverable
A `OrgThemeProvider` component that fetches `GET /api/v1/organizations/by-domain?domain=${window.location.hostname}` on mount, sets `document.documentElement.style.setProperty('--primary', ...)` for `primary_color`, `secondary_color`, and `accent_color`, stores the `Organization` object in React context, and renders a loading skeleton while fetching and an error boundary fallback if the org is not found.

## Inputs
```typescript
// Fetched from API on mount — no props required
// Context value shape:
interface OrgThemeContextValue {
  org: Organization | null;
  isLoading: boolean;
  error: string | null;
}
```

## Outputs
- CSS custom properties injected into `document.documentElement`:
  ```css
  :root {
    --primary: #0F766E;      /* from branding_theme.primary_color */
    --secondary: #...;       /* from branding_theme.secondary_color */
    --accent: #...;          /* from branding_theme.accent_color */
  }
  ```
- `useOrgTheme()` hook returns `{ org, isLoading, error }` for consumption by child components.
- `document.title` is updated to `org.name` after successful fetch.
- `<link rel="icon">` href updated to `org.branding_theme.favicon_url`.

## Acceptance Criteria
- [ ] On first render, the provider shows a loading state (spinner or skeleton) and makes exactly one fetch to `/api/v1/organizations/by-domain?domain=<hostname>`.
- [ ] After successful fetch, `document.documentElement.style.getPropertyValue('--primary')` returns the org's `primary_color`.
- [ ] `useOrgTheme().org` returns the full `Organization` object (non-null) after load completes.
- [ ] If the API returns 404, `useOrgTheme().error` is non-null and the provider renders a fallback error UI (not a blank screen).
- [ ] Re-renders do not trigger additional fetch calls (fetch runs only once on mount).

## Do NOT
- Do not hardcode any color values — all colors must come from the API response.
- Do not call Supabase directly from this context — use `fetch('/api/v1/...')` only.
- Do not implement any routing logic here — this is a pure data/theming provider.
- Do not store the organization data in localStorage or sessionStorage in this task.
