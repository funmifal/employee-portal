---
trigger: always_on
---

# Design System Rules

## Purpose

Ensure the interface communicates the state and trustworthiness of digitized company knowledge clearly.

## Core Principle

The UI must distinguish between:

1. Original source material
2. AI-extracted content
3. AI-generated/compiled content
4. Human-reviewed content
5. Published/approved content

Users must never be forced to guess which content is authoritative.

## Upload Experience

- Support single and bulk image upload.
- Clearly communicate accepted formats:
  - JPEG
  - PNG
  - WebP
- Clearly communicate the 50MB batch limit.
- Display upload failures without hiding successful uploads in the same batch.
- Never imply processing has started when only uploading has completed.

## Processing Experience

Processing UI must communicate the current stage.

Relevant stages include:

- ingestion/preprocessing
- OCR/extraction
- sequencing
- compilation
- confidence/review

Progress indicators must represent actual application state.

Do not fabricate percentage progress merely to make the interface appear active.

## Review Experience

The manual editor must make the original source image and extracted/compiled content easy to compare.

Low-confidence content must have a visually distinct review state.

Warnings must not be confused with successful processing.

## Role-Aware UI

- VIEWER interfaces must not expose editing controls.
- EDITOR interfaces may expose upload and compilation workflows.
- ADMIN interfaces may expose publishing and role-management controls.

UI restrictions do not replace server-side authorization.

## Accessibility

Core workflows must remain usable with:

- keyboard navigation
- readable labels
- sufficient semantic structure
- clear error messages
- non-color-only status communication

## Avoid

- Decorative complexity that makes processing state harder to understand.
- Hiding AI uncertainty.
- Making AI-generated text visually indistinguishable from verified content.
- UI states that imply an operation succeeded when the backend has not confirmed success.