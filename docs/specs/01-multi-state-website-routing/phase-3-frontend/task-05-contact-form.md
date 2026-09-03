# Task 05: Build ContactForm Component

**Spec:** `01-multi-state-website-routing` | **Phase:** 3-Frontend | **Task:** 05

## Prerequisites
- Task 03 complete: `POST /api/v1/inquiries` route is live and accepts `CreatePublicInquirySchema`.
- Task 04 complete: `OrgThemeContext` is implemented and exports `useOrgTheme()`.
- `@crystal/validation` package exports `CreatePublicInquirySchema`.
- `@crystal/ui` components installed: `Button`, `Input`, `Textarea`, `Select`, `Alert`.
- Both SPAs (`apps/georgia/`, `apps/indiana/`) initialized with React 19 and React Hook Form + `@hookform/resolvers/zod`.

## Context
The public website on each state SPA features a contact form for general questions, client care inquiries, and prospective caregiver leads. This component manages client-side form state and validation using React Hook Form and Zod, includes a hidden honeypot field to drop automated bot submissions, attaches tenant metadata (`org_id` and `state_code`) from `OrgThemeContext`, and submits to the Express API. It implements an explicit state machine (`idle` -> `validating` -> `submitting` -> `success` / `error`) to disable buttons during flight and render in-place feedback without full-page reloads.

## Stack & Files
- **Layer:** Vite React (applies to both `apps/georgia/src/` and `apps/indiana/src/`)
- **Create:** `apps/georgia/src/components/forms/ContactForm.tsx` — contact form component with React Hook Form, Zod validation, and state machine
- **Create:** `apps/georgia/src/hooks/useSubmitInquiry.ts` — custom hook managing submission lifecycle and network request
- **Create:** `apps/indiana/src/components/forms/ContactForm.tsx` — identical component for Indiana SPA
- **Create:** `apps/indiana/src/hooks/useSubmitInquiry.ts` — identical hook for Indiana SPA

## Deliverable
A `ContactForm` React component that collects user inquiry details, attaches `org_id` and `state_code` from `OrgThemeContext`, renders a hidden honeypot field, runs client-side Zod validation, posts to `POST /api/v1/inquiries`, and transitions cleanly across `idle`, `validating`, `submitting`, `success`, and `error` UI states.

## Inputs
```typescript
// Component props (optional configuration)
interface ContactFormProps {
  defaultInquiryType?: 'caregiver_inquiry' | 'client_care_inquiry' | 'general_question';
  onSuccessCallback?: (inquiryId: string) => void;
  className?: string;
}

// Form values schema (derived from CreatePublicInquirySchema in @crystal/validation)
interface ContactFormValues {
  full_name: string;        // min 2, max 100
  email: string;            // valid email
  phone: string;            // US phone regex
  inquiry_type: 'caregiver_inquiry' | 'client_care_inquiry' | 'general_question';
  message: string;          // min 10, max 2000
  honeypot?: string;        // hidden field, must remain empty
}
```

## Outputs
- **Default State (`idle` / `validating`):** Renders form with inputs for Full Name, Email, Phone, Inquiry Type selector, Message textarea, hidden honeypot input, and a Submit button.
- **Submitting State (`submitting`):** All form inputs and Submit button are disabled; Submit button displays a loading spinner and "Sending...".
- **Success State (`success`):** Replaces form fields with a success card showing a confirmation checkmark, "Thank you! Your message has been received.", and a "Send another message" reset button.
- **Error State (`error`):** Retains user input and displays a top-level `Alert` variant="destructive" with an error message and retry prompt.
- **Network Call:** `fetch('/api/v1/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })`.

## Acceptance Criteria
- [ ] Submitting valid data sends a `POST /api/v1/inquiries` payload containing `org_id`, `state_code`, form values, and `source_url: window.location.href`.
- [ ] Transitions accurately across states: `idle` -> `submitting` -> `success` (or `error`).
- [ ] Invalid inputs (e.g. invalid phone number or message under 10 characters) display inline Zod error messages and prevent network dispatch.
- [ ] The submit button is disabled while `submitting` to prevent duplicate submissions.
- [ ] The honeypot input is visually hidden from human users using CSS (`opacity-0 absolute -z-10 pointer-events-none`) and tab-indexed out (`tabIndex={-1}`).
- [ ] Clicking "Send another message" in the success state resets form state back to `idle`.

## Do NOT
- Do NOT call Supabase or database directly from the component or hook — use `fetch('/api/v1/inquiries')` only.
- Do NOT use Next.js server actions, `'use client'`, or `next/navigation`.
- Do NOT hardcode `org_id` or `state_code` — retrieve both values from `useOrgTheme()`.
- Do NOT navigate away to another route upon submission; present an in-place success state.
