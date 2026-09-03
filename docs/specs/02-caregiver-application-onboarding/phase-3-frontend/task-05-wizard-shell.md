# Task 05: Build Wizard Shell (WizardHeader & StepIndicator)

**Spec:** `02-caregiver-application-onboarding` | **Phase:** 3-Frontend | **Task:** 05

## Prerequisites
- React Router v7 configured in both SPA projects (`apps/georgia/`, `apps/indiana/`).
- `OrgThemeContext` operational and providing tenant branding (`--primary` CSS custom property).
- `@crystal/ui` components available (`Button`, `Progress`, `Badge`).

## Context
The caregiver onboarding application is structured as a 5-step guided wizard. This task creates the container shell that surrounds all wizard steps, consisting of `WizardHeader` and `StepIndicator`. The header shows the tenant logo, a "Save & Exit" action, and an animated progress bar indicating overall percentage completion. The step indicator displays all 5 stages (Personal Info, Availability, Experience, Licenses, Attestation), highlighting the current step, marking previous steps with checkmarks, and disallowing direct jumps to incomplete future steps.

## Stack & Files
- **Layer:** Vite React (applies to both `apps/georgia/src/` and `apps/indiana/src/`)
- **Create:** `apps/georgia/src/pages/apply/ApplyWizardLayout.tsx` — layout container rendering header, step indicator, and `<Outlet />`
- **Create:** `apps/georgia/src/components/apply/WizardHeader.tsx` — top navigation with progress bar and "Save & Exit" trigger
- **Create:** `apps/georgia/src/components/apply/StepIndicator.tsx` — 5-step responsive horizontal indicator
- **Create:** `apps/indiana/src/pages/apply/ApplyWizardLayout.tsx` — identical layout container for Indiana SPA
- **Create:** `apps/indiana/src/components/apply/WizardHeader.tsx` — identical header component for Indiana SPA
- **Create:** `apps/indiana/src/components/apply/StepIndicator.tsx` — identical indicator component for Indiana SPA
- **Modify:** `apps/georgia/src/App.tsx` — configure `/apply` parent route using `ApplyWizardLayout`
- **Modify:** `apps/indiana/src/App.tsx` — configure `/apply` parent route using `ApplyWizardLayout`

## Deliverable
A layout component `ApplyWizardLayout` hosting `WizardHeader` and `StepIndicator` that displays real-time wizard progress (20% to 100%), provides a functional "Save & Exit" handler, renders an `<Outlet />` for step sub-routes, and dynamically styles active steps using the tenant's `--primary` brand token.

## Inputs
```typescript
// Component Props:
interface WizardHeaderProps {
  currentStep: number;                 // 1 to 5
  totalSteps?: number;                // default 5
  onSaveAndExit: () => Promise<void>;
  isSaving?: boolean;
}

interface StepIndicatorProps {
  currentStep: number;                 // 1 to 5
  completedSteps: number[];            // e.g. [1, 2]
  onStepSelect?: (step: number) => void; // only callable for steps in completedSteps
}
```

## Outputs
- **`WizardHeader`:** Top bar with tenant logo, step count label (e.g. "Step 2 of 5"), animated `<Progress value={(currentStep / 5) * 100} />`, and a "Save & Exit" button with loading state.
- **`StepIndicator`:** Horizontal stepper displaying:
  1. Personal Info
  2. Availability & Roles
  3. Experience & References
  4. Licensure
  5. Attestation
  - Active step highlighted with `--primary` fill and ring.
  - Completed steps show a green checkmark icon.
  - Upcoming incomplete steps are dimmed and non-clickable.
  - Collapses to compact numbered pills on mobile viewports (< 640px).
- **`ApplyWizardLayout`:** Page shell wrapping `<WizardHeader />`, `<StepIndicator />`, and `<main className="max-w-3xl mx-auto px-4 py-8"><Outlet /></main>`.

## Acceptance Criteria
- [ ] All 5 step titles and indices are rendered correctly on desktop viewports.
- [ ] The progress bar value smoothly updates to `(currentStep / 5) * 100`% as `currentStep` changes.
- [ ] Clicking "Save & Exit" triggers `onSaveAndExit`, displays a saving spinner, and redirects to `/` upon completion.
- [ ] Clicking a completed step triggers `onStepSelect(step)`, while clicking an incomplete future step is blocked.
- [ ] Responsive design hides text labels on screens < 640px while retaining step number indicators.

## Do NOT
- Do NOT implement step form inputs or Zod schemas in this task (reserved for tasks 06–10).
- Do NOT hardcode colors — use Tailwind classes referencing `--primary` or CSS custom properties.
- Do NOT call Supabase or database endpoints directly from the layout shell.
- Do NOT use Next.js routing (`next/navigation`, `useRouter` from Next); use `react-router-dom`.
