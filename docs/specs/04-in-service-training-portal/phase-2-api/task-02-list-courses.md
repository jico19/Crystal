# Task 02: List Training Courses Express Route
**Spec:** `04-in-service-training-portal` | **Phase:** 2-API | **Task:** 02

## Prerequisites
- [x] Task 01: `training_modules` table exists

## Context
Caregivers query the course catalog to view available state-mandated in-service courses, required CEU credit hours, and their completion status for each module.

## Stack & Files
- **Layer:** Express API
- **Create:** `apps/api/src/modules/training/training.router.ts`
- **Create:** `apps/api/src/modules/training/training.controller.ts`
- **Create:** `apps/api/src/modules/training/training.service.ts`

## Deliverable
An Express route `GET /api/v1/training/courses` returning active training modules for the caregiver's state org along with the caregiver's progress records (`watch_progress_percentage`, `quiz_score_percentage`, `passed`).

## Inputs
- Auth Context: `req.user.id`, `req.user.org_id`

## Outputs
- `200 OK`: `{ success: true, data: { courses: CourseWithProgress[] } }`

## Acceptance Criteria
- [ ] Returns courses matching caregiver's `state_code` or platform-wide (`ALL`)
- [ ] Merges caregiver progress status into response object for each course
- [ ] Calculates total annual CEU hours completed vs total required

## Do NOT
- Do not expose quiz correct answer indexes in the public course list payload
