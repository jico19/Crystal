# Task 04: Submit Module Quiz Express Route
**Spec:** `04-in-service-training-portal` | **Phase:** 2-API | **Task:** 04

## Prerequisites
- [x] Task 01: `training_modules` table exists
- [x] Notification engine queued endpoint exists

## Context
When a caregiver submits their answers to an end-of-module knowledge check, this route grades the quiz, evaluates passing threshold ($\ge 80\%$), generates a verifiable certificate SHA-256 hash if passed, and dispatches a completion email.

## Stack & Files
- **Layer:** Express API
- **Modify:** `apps/api/src/modules/training/training.router.ts` — mount `POST /courses/:id/quiz`
- **Modify:** `apps/api/src/modules/training/training.service.ts`

## Deliverable
An Express route `POST /api/v1/training/courses/:id/quiz` validating `QuizSubmissionSchema`, comparing submitted answer indexes against correct answer indexes in DB, calculating score percentage, generating a SHA-256 certificate hash if passed, saving results, and returning `{ success: true, scorePercentage, passed, certUrl }`.

## Inputs
- Route param: `:id` (Module UUID)
- Request Body (validated via `QuizSubmissionSchema`):
```typescript
{
  answers: [
    { question_id: string, selected_index: number }
  ]
}
```

## Outputs
- `200 OK`: `{ success: true, scorePercentage: number, passed: boolean, certificateUrl?: string }`
- `400 Bad Request`: Incomplete answers or video not completed first

## Acceptance Criteria
- [ ] Verifies `video_completed = true` before allowing quiz submission
- [ ] Compares submitted selected indexes against secret correct indexes in DB
- [ ] Marks module `passed = true` if score >= `passing_score_percentage` (default 80%)
- [ ] Generates SHA-256 certificate hash using `SHA256(user_id + module_id + timestamp)`
- [ ] Increments `quiz_attempts` counter in database

## Do NOT
- Do not expose correct answer indexes to client if quiz is failed
