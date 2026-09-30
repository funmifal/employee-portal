---
trigger: always_on
---

# Coding Standards

## Purpose

These rules govern implementation quality for the Employee Portal Note Digitization & Manual Compiler.

## Mandatory Rules

- Use TypeScript throughout the application.
- Keep TypeScript strict and do not use `any` to bypass type errors.
- Keep business logic out of UI components where that logic can be reused or tested independently.
- Validate all external input before it reaches business logic, including:
  - uploaded files
  - API requests
  - form submissions
  - AI responses
  - search queries
  - database identifiers
- Treat OCR output and AI-generated content as untrusted input.
- Keep image processing, OCR, sequencing, compilation, confidence scoring, embeddings, and search as separable responsibilities.
- Prefer small, testable functions over large orchestration functions.
- Use explicit domain types for processing statuses, roles, AI results, and validation results.
- Do not silently swallow processing errors.
- Errors must preserve enough context to identify the failed processing stage.
- Server-side authorization must be enforced independently of UI visibility.
- Database mutations that require multiple related changes must use appropriate transactional boundaries.
- Do not duplicate business rules across API routes, server actions, and UI components.
- Keep provider-specific AI implementation behind provider adapters.
- Do not hard-code Claude or DeepSeek-specific behavior into core processing logic.
- Configuration and secrets must come from environment/configuration rather than source code.

## Testing

Tests must cover behavior that can cause:

- lost uploaded content
- incorrect processing status
- unauthorized access
- incorrect manual ownership
- invalid AI output being persisted
- stale embeddings
- broken source-image/text relationships

## Avoid

- Premature abstractions without a demonstrated reuse case.
- Giant service classes that own unrelated workflows.
- Business logic hidden inside presentation components.
- Silent fallbacks that make failed AI processing appear successful.
- Provider-specific logic scattered throughout the application.