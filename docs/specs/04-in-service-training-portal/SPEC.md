# SPEC: In-Service Training & Continuing Education Portal

**Spec ID:** `04-in-service-training-portal`

---

## Goal

Provide a fully digital in-service training and continuing education learning management portal enabling Georgia and Indiana caregivers to complete state-mandated training modules (Elder Abuse, HIPAA, Infection Control, Emergency Procedures), take end-of-module knowledge checks, and automatically earn verifiable completion certificates.

## Problem Statement

Tracking mandatory annual in-service hours (12+ hours per caregiver per year in Georgia and Indiana) currently requires manual sign-in sheets, paper quizzes, and ad-hoc filing. Missing training records expose the agency to severe audit citations and loss of operating licenses.

---

## Scope Boundaries

### In-Scope
- Video lesson streaming with anti-skipping playback tracking (cannot seek forward past watched position).
- Interactive multiple-choice knowledge checks with 80% passing grade enforcement.
- Automatic PDF certificate generation with unique SHA-256 verification hash on quiz pass.
- Caregiver annual hours progress tracking (total completed CEU hours vs. state-required hours).
- Admin/coordinator training compliance dashboard showing completion percentage per caregiver.
- Amazon SES email notification on certificate earned.

### Out-of-Scope
- Live virtual classroom / WebRTC video conferencing (all training is asynchronous on-demand).
- Partial-credit grading — quiz is graded as pass/fail at 80% threshold.
- Certificate revocation.

---

## Key Domain Concepts

| Term | Definition |
|---|---|
| `training_modules` | DB table of video lessons with embedded quiz questions as JSONB |
| `caregiver_training_progress` | DB table tracking one row per caregiver+module; stores watch %, quiz score, pass status, cert URL |
| `watch_progress_percentage` | Furthest watched position as a percentage; used to enforce anti-skip |
| `certificate_hash` | SHA-256 hash unique to each caregiver+module+timestamp; used for public certificate verification |
| `passing_score_percentage` | Module-level threshold (default 80%); quiz graded against this |
| `quiz_questions` | JSONB array: `[{ id, question, options: string[], correct_index: number }]` |
| Annual CEU hours | Sum of `required_hours` for all modules where `passed = true` in the current calendar year |

### State Codes
`GA` | `IN` | `FL` | `ALL` (platform-wide)

---

## Zod Schema Names (defined in `@crystal/validation`)

- `QuizSubmissionSchema` — validates `module_id` (UUID) and `answers` array of `{ question_id: string, selected_index: number (0-10) }` (min 1 item)
- `VideoProgressUpdateSchema` — validates `module_id` (UUID), `watch_progress_seconds` (>= 0), `total_duration_seconds` (>= 1)

---

## Business Rules

1. **Anti-skip enforcement:** `watch_progress_percentage` can only increase, never decrease. The frontend prevents seeking past the furthest watched second; the API ignores regressive progress updates.
2. **Quiz unlock:** The quiz submit endpoint must verify `video_completed = true` (or `watch_progress_percentage >= 90`) before grading; otherwise return `403 Forbidden`.
3. **Quiz attempts:** Unlimited retakes are permitted, but `quiz_attempts` is incremented on each submission.
4. **Certificate generation:** Certificate is generated only on first pass. Subsequent retakes do not regenerate the certificate.
5. **Org scoping:** Modules with `org_id = NULL` are platform-wide (visible to all orgs). Modules with a specific `org_id` are visible only to that org's caregivers.

---

## Background Automation & Agent Triggers

- **Trigger:** DB event on `caregiver_training_progress` UPDATE where `passed = true`
- `Agent-Training` increments caregiver's cumulative annual CEU hours.
- Updates `caregiver_profiles.onboarding_checklist->in_service_orientation` to `'verified'` once core modules are completed.
- Dispatches congratulations email with attached PDF certificate via Amazon SES.

---

## Edge Cases

| Failure Scenario | Root Cause | System Response & Mitigation |
|---|---|---|
| **Fast-Forward / Video Skipping** | Caregiver attempts to seek to end | VideoPlayer disables seeking ahead of furthest watched position; quiz locked until 90%+ watch threshold met |
| **Failed Quiz Attempt** | Score < 80% | Returns score and which concepts were wrong (without revealing exact answer keys); permits unlimited retakes |
| **PDF Generation Error** | Certificate builder times out | Quiz marked `passed = true` in DB; background job retries certificate rendering and notifies user via email when ready |
| **Module not found for org** | Caregiver from different state queries another state module | API scopes module listing to caregiver state_code and org_id; returns 404 for out-of-scope modules |
| **Duplicate completion** | Caregiver resubmits quiz after already passing | Upsert logic preserves original `completed_at`; certificate not regenerated; returns existing cert URL |

---

## Acceptance Tests (Gherkin)

```gherkin
Feature: In-Service Training & Certification

  Scenario: Caregiver completes video and passes quiz
    Given an authenticated caregiver watching "HIPAA Compliance 101"
    When the caregiver completes 100% of the video
    And scores 90% on the end-of-module quiz
    Then the module is marked as "passed"
    And a verifiable PDF certificate is instantly generated
    And the caregiver annual completed hours increase by 1.0

  Scenario: Caregiver attempts to skip video
    Given a caregiver on a video lesson at 20% watched
    When the caregiver drags the seek bar to 80%
    Then the player resets the position to 20%
    And the quiz remains locked

  Scenario: Caregiver fails quiz and retakes
    Given a caregiver who has completed the video
    When the caregiver submits a quiz with 60% score
    Then the system returns "Not Passed" with score feedback
    And quiz_attempts increments by 1
    When the caregiver retakes and scores 85%
    Then the module is marked "passed" and a certificate is generated

  Scenario: Admin views compliance dashboard
    Given an admin user for a Georgia org
    When the admin opens the training compliance dashboard
    Then a list of all caregivers is shown with their completed hours and completion percentage
```

---

## Task Map

| Task | Phase | Title |
|---|---|---|
| task-01 | Database | Training schema, RLS, indexes |
| task-02 | API | GET /api/v1/training/courses |
| task-03 | API | PUT /api/v1/training/courses/:id/progress |
| task-04 | API | POST /api/v1/training/courses/:id/quiz |
| task-05 | API | GET /api/v1/training/certificates/:id |
| task-06 | Frontend | Course catalog page |
| task-07 | Frontend | VideoPlayer component |
| task-08 | Frontend | QuizModal component |
| task-09 | Frontend | CertificateModal component |
