# Task 07: HTML5 Signature Canvas Pad
**Spec:** `09-esignature-workflow` | **Phase:** 3-Frontend | **Task:** 07

## Prerequisites
- [x] HTML5 Canvas API support

## Context
Provides an interactive signature pad component supporting mouse/touch freehand drawing as well as typed font signature generation.

## Stack & Files
- **Layer:** Vite React SPA
- **Create:** `apps/georgia/src/components/esign/SignatureCanvasPad.tsx`

## Deliverable
An HTML5 canvas signature pad component (`SignatureCanvasPad.tsx`) with tab toggle (`Draw Signature` vs `Type Signature`), clear button, smooth line interpolation, and base64 PNG export.

## Inputs
- Props: `{ onSave: (base64Signature: string) => void, onClear: () => void }`

## Outputs
- Exported base64 image data URL string representing the user's signature

## Acceptance Criteria
- [ ] Supports touch events (mobile phones/tablets) and mouse dragging
- [ ] Clear button resets canvas and clears exported value
- [ ] Typed signature tab renders user name in script cursive font
- [ ] Exports clean base64 PNG data string upon signature capture

## Do NOT
- Do not export blank/empty canvas submissions — validate stroke count > 0
