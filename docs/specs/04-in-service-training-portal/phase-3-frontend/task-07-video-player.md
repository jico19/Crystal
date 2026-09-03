# Task 07: Video Lesson Player with Seek Lock Component
**Spec:** `04-in-service-training-portal` | **Phase:** 3-Frontend | **Task:** 07

## Prerequisites
- [x] Task 03: `PUT /api/v1/training/courses/:id/progress` API route exists

## Context
Renders the HTML5 video lesson player for training modules. To prevent skipping state-mandated training content, seeking forward beyond the maximum watched timestamp is disabled. Periodically sends heartbeat updates to backend API.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/components/training/VideoPlayer.tsx`

## Deliverable
A custom HTML5 video player component (`VideoPlayer.tsx`) enforcing seek-lock restrictions (disables seeking ahead of max watched time), emitting heartbeat progress updates every 10 seconds to `PUT /api/v1/training/courses/:id/progress`, and unlocking the "Take Quiz" button once 90% watched.

## Inputs
- Props: `{ moduleId: string, videoUrl: string, initialProgress: number, onVideoCompleted: () => void }`

## Outputs
- Periodic API calls to `PUT /api/v1/training/courses/:id/progress`
- Unlocks knowledge check quiz upon 90% watch threshold

## Acceptance Criteria
- [ ] Prevents seeking forward past current max watched timestamp
- [ ] Allows seeking backward to review previously watched video sections
- [ ] Emits heartbeat API update every 10 seconds of playback
- [ ] Unlocks "Take Knowledge Check Quiz" button when watch progress reaches 90%

## Do NOT
- Do not allow fast-forwarding to the end of video to bypass training requirement
