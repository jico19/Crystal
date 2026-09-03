# Task 08: End-of-Module Quiz Modal Component
**Spec:** `04-in-service-training-portal` | **Phase:** 3-Frontend | **Task:** 08

## Prerequisites
- [x] Task 04: `POST /api/v1/training/courses/:id/quiz` API route exists

## Context
Caregivers take multiple-choice knowledge check quizzes after completing video lessons. Passing grade is 80%.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/components/training/QuizModal.tsx`

## Deliverable
An interactive quiz dialog modal component (`QuizModal.tsx`) rendering multiple-choice question cards, tracking selected answer indexes, submitting answers to `POST /api/v1/training/courses/:id/quiz`, and displaying score feedback modal (`Passed!` or `Try Again`).

## Inputs
- Props: `{ moduleId: string, questions: Question[], open: boolean, onOpenChange: (open: boolean) => void }`

## Outputs
- API Call: `POST /api/v1/training/courses/:id/quiz`
- Displays pass/fail score summary with certificate download button on pass

## Acceptance Criteria
- [ ] Renders all quiz questions with radio option selectors
- [ ] Validates all questions answered before enabling submit button
- [ ] On Pass ($\ge 80\%$): Displays celebration screen + certificate download button
- [ ] On Fail ($< 80\%$): Displays score feedback and permits retaking quiz

## Do NOT
- Do not display correct answer key on failure screens
