---
trigger: glob
---

# AI Pipeline Rules

## Purpose

Define a provider-neutral AI architecture that supports Claude, DeepSeek, or another approved provider without coupling the application to one vendor.

## Core Principle

Claude and DeepSeek are integrations, not the application architecture.

The core processing pipeline must not depend directly on a provider-specific SDK, API response format, model name, or prompt format.

## Provider Architecture

AI integrations must sit behind a provider abstraction/adapter.

The application should conceptually depend on capabilities such as:

- image understanding
- OCR/text extraction
- structured parsing
- sequencing analysis
- document compilation
- embedding generation

Provider-specific adapters are responsible for translating those capabilities to the selected provider.

## Claude and DeepSeek Compatibility

The pipeline must support provider configuration without changing core business logic.

Provider-specific differences must be isolated to the adapter/configuration layer.

Do not write code such as:

- `if provider === "claude"` throughout business logic
- `if provider === "deepseek"` throughout processing services

Provider-specific branching belongs inside the provider integration layer when genuinely required.

## Capability-Based Selection

Do not assume every model supports every capability.

A provider/model configuration must be able to declare capabilities such as:

- vision/image input
- structured output
- text generation
- embedding generation

If a selected model cannot perform a required pipeline stage, the system must fail clearly rather than silently substituting an unsupported behavior.

## Structured Output

AI responses must be validated before entering domain logic.

Use explicit schemas for expected outputs such as:

- OCR extraction
- detected structure
- page sequencing
- chapter compilation
- confidence information

Malformed AI responses must be rejected or retried according to the processing strategy.

## AI Is Not Authoritative

AI-generated content must never automatically become trusted company knowledge merely because a model returned it.

The system must preserve human review for low-confidence or ambiguous content.

## Prompting

Prompts must be:

- versionable
- provider-neutral where possible
- explicit about expected output
- isolated from business logic
- tested against representative inputs

Do not depend on undocumented provider-specific prompt behavior.

## Errors and Retries

Handle:

- provider timeouts
- rate limits
- malformed responses
- unavailable models
- invalid media
- temporary provider failures

Do not retry indefinitely.

Do not convert provider failure into a successful processing state.

## Privacy

AI requests must respect the enterprise data-protection requirements in the PRD.

Use:

- enterprise zero-data-retention AI endpoints, or
- self-hosted open-weight vision models

when appropriate to the deployment.

Never expose provider credentials to the client.

## Embeddings

Embedding generation must remain separately configurable from generative/vision processing.

Do not assume Claude or DeepSeek is automatically the embedding provider.

The embedding implementation must remain compatible with PostgreSQL pgvector.

## Model Configuration

Model names, provider endpoints, credentials, and operational settings belong in configuration.

Do not hard-code model credentials or assume a single permanent provider.

## Future Provider Changes

Adding another provider should primarily require:

1. a provider adapter
2. capability configuration
3. provider-specific validation/tests

It must not require rewriting the domain processing pipeline.