---
trigger: always_on
---

# Project and Processing Status Rules

## Purpose

Ensure the application reports processing state accurately.

## Authoritative Processing States

Use only the processing statuses defined by the PRD:

- `PENDING`
- `PROCESSING`
- `FLAGGED_REVIEW`
- `COMPLETED`
- `FAILED`

## Status Rules

### PENDING

The batch has been accepted but processing has not started.

### PROCESSING

One or more processing stages are actively running.

### FLAGGED_REVIEW

Processing produced content requiring human review, such as low-confidence extraction.

### COMPLETED

The defined processing workflow completed successfully and no required processing stage remains incomplete.

### FAILED

A required processing stage failed and the workflow cannot be considered successfully completed.

## Mandatory Rules

- Never report `COMPLETED` before required processing has actually completed.
- Never hide a processing failure behind a successful UI state.
- Low-confidence content must be capable of reaching `FLAGGED_REVIEW`.
- Status transitions must correspond to actual backend state.
- Client-side status displays must not invent backend progress.
- Retry behavior must preserve the distinction between a failed attempt and a successfully completed workflow.
- Do not introduce additional persistent processing statuses without updating the PRD/schema.

## Progress

The UI may display stage-level progress, but progress must be based on real processing state.

Do not use fake progress timers to imply work is being performed.