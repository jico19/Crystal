# Task 06: Course Catalog & Hours Progress Bar Page
**Spec:** `04-in-service-training-portal` | **Phase:** 3-Frontend | **Task:** 06

## Prerequisites
- [x] Task 02: `GET /api/v1/training/courses` API route exists

## Context
Caregivers land on the Training Portal catalog to view required annual CEU modules (e.g., Elder Abuse, HIPAA, Infection Control), track completed hours vs mandatory state requirements (12 hours/year), and launch course lessons.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/pages/training/CourseCatalogPage.tsx`
- **Create:** `apps/georgia/src/components/training/AnnualProgressBanner.tsx`
- **Create:** `apps/georgia/src/components/training/CourseCardGrid.tsx`

## Deliverable
A course catalog page (`CourseCatalogPage.tsx`) rendering `AnnualProgressBanner` (e.g. `8.0 / 12.0 CEU Hours Completed`), course category filters (`All`, `HIPAA`, `Safety`, `Dementia`), and cards showing course duration, credit hours, and status badges (`Not Started`, `In Progress`, `Passed`).

## Inputs
- Data fetched from `GET /api/v1/training/courses`

## Outputs
- Rendered course catalog UI with annual hours progress tracker

## Acceptance Criteria
- [ ] Displays annual CEU progress bar (e.g. 8.0 of 12.0 hours completed)
- [ ] Category filter tabs filter displayed course cards
- [ ] Course cards show status badges (`Not Started` gray, `In Progress` blue, `Passed` green)
- [ ] Clicking a course card navigates to `/training/courses/:id`

## Do NOT
- Do not hardcode required annual hours — derive dynamically from caregiver role & state regulation
