# Task 02: Build GET /api/v1/organizations/by-domain Route

**Spec:** `01-multi-state-website-routing` | **Phase:** 2-API | **Task:** 02

## Prerequisites
- Task 01 complete: `organizations` table and RLS policies exist in PostgreSQL.
- `apps/api/src/db/` query client is configured and exported.
- Express v5 app skeleton exists at `apps/api/src/app.ts` with a `/api/v1` router mounted.

## Context
Each state SPA calls this route immediately on boot (before rendering anything) to retrieve its organization's branding configuration, contact info, and enabled services. The domain queried is `window.location.hostname`. The route is unauthenticated because it serves public branding data. Response data is used by the `OrgThemeProvider` React context (Task 04) to inject CSS variables and populate layout components.

## Stack & Files
- **Layer:** Express API
- **Create:** `apps/api/src/modules/organizations/organizations.router.ts` — mounts GET route on `/by-domain`
- **Create:** `apps/api/src/modules/organizations/organizations.controller.ts` — extracts `domain` query param, calls service, returns response
- **Create:** `apps/api/src/modules/organizations/organizations.service.ts` — queries DB by `primary_domain` with fallback to `subdomains` array contains check
- **Create:** `apps/api/src/modules/organizations/organizations.repository.ts` — raw SQL: `SELECT * FROM organizations WHERE primary_domain = $1 AND is_active = true`
- **Modify:** `apps/api/src/app.ts` — mount `organizationsRouter` at `/api/v1/organizations`

## Deliverable
An Express route `GET /api/v1/organizations/by-domain?domain=withopenhands.com` that queries the `organizations` table by `primary_domain`, validates the result against `OrganizationSchema` from `@crystal/validation`, and returns `{ success: true, data: Organization }` or `404` if not found.

## Inputs
```
Query parameter:
  domain: string   // e.g. "withopenhands.com" or "cherishopenarms.com"
```

## Outputs
**200 Success:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "With Open Hands",
    "state_code": "GA",
    "primary_domain": "withopenhands.com",
    "branding_theme": {
      "primary_color": "#0F766E",
      "secondary_color": "...",
      "accent_color": "...",
      "logo_url": "...",
      "favicon_url": "...",
      "hero_headline": "...",
      "hero_subheading": "..."
    },
    "contact_phone": "...",
    "contact_email": "...",
    "office_address": { "street": "...", "city": "Atlanta", "state": "GA", "zip": "..." },
    "office_hours": "...",
    "license_number": "...",
    "enabled_services": [],
    "is_active": true
  }
}
```
**400 Bad Request** (missing or empty `domain` param):
```json
{ "success": false, "error": "domain query parameter is required" }
```
**404 Not Found** (no active org for that domain):
```json
{ "success": false, "error": "Organization not found for domain" }
```

## Acceptance Criteria
- [ ] `GET /api/v1/organizations/by-domain?domain=withopenhands.com` returns `200` with GA org data when a GA row exists in the DB.
- [ ] `GET /api/v1/organizations/by-domain?domain=unknown.com` returns `404`.
- [ ] `GET /api/v1/organizations/by-domain` (no param) returns `400`.
- [ ] Route requires no authentication header — anonymous callers must receive a valid `200` response.
- [ ] Response body passes `OrganizationSchema.parse()` without throwing.

## Do NOT
- Do not add authentication middleware to this route — it must be publicly accessible.
- Do not expose internal database error messages in the response body.
- Do not implement any `POST`/`PUT`/`DELETE` org management routes in this task.
- Do not query the `public_inquiries` table here.
