# Task 03: Update Video Progress Express Route
**Spec:** `04-in-service-training-portal` | **Phase:** 2-API | **Task:** 03

## Prerequisites
- [x] Task 01: `caregiver_training_progress` table exists

## Context
As the caregiver watches a video lesson, the frontend periodically sends heartbeat progress updates to store watch percentage and mark video completion once $\ge 90\%$ watched.

## Stack & Files
- **Layer:** Express API
- **Modify:** `apps/api/src/modules/training/training.router.ts` — mount `PUT /courses/:id/progress`
- **Modify:** `apps/api/src/modules/training/training.controller.ts`

## Deliverable
An Express route `PUT /api/v1/training/courses/:id/progress` validating `VideoProgressUpdateSchema` from `@crystal/validation`, updating `watch_progress_percentage`, setting `video_completed = true` if progress $\ge 90\%$, and returning `{ success: true, videoCompleted: boolean }`.

## Inputs
- Route param: `:id` (Module UUID)
- Body: `{ watch_progress_seconds: number, total_duration_seconds: number }`

## Outputs
- `200 OK`: `{ success: true, videoCompleted: boolean, progressPercentage: number }`

## Acceptance Criteria
- [ ] Calculates watch percentage accurately from seconds watched / total duration
- [ ] Marks `video_completed = true` when watch percentage reaches 90%
- [ ] Upserts progress record into `caregiver_training_progress`

## Do NOT
- Do not allow watch percentage to decrease on subsequent heartbeats
