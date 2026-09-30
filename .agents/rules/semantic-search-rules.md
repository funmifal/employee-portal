---
trigger: always_on
---

# Semantic Search Rules

## Purpose

Define how users search digitized company knowledge using semantic retrieval.

## Storage

PostgreSQL with pgvector is the required vector storage technology.

Do not introduce a separate vector database unless the requirements explicitly change.

## Embedding Lifecycle

Embeddings must correspond to the exact content they represent.

When indexed content changes materially, its associated embedding must not remain silently stale.

The system must have a deterministic way to identify content requiring re-embedding.

## Chunking

Content must be divided into meaningful searchable chunks.

Do not create chunks so large that retrieval becomes imprecise.

Do not create extremely small chunks that lose meaningful context.

Chunking strategy should preserve chapter/manual context where useful.

## Embedding Provider

Do not assume the generative AI provider is also the embedding provider.

Claude or DeepSeek may be used for other AI capabilities while embeddings use a separately configured compatible provider.

Embedding provider details must remain behind an abstraction/configuration boundary.

## Search

Semantic search should retrieve content based on meaning rather than exact keyword matching alone.

Search results must retain enough context to identify the relevant manual/chapter.

## Authorization

Search is subject to the same authorization rules as direct manual access.

A user must never receive search results containing content they are not authorized to access.

Do not rely on hiding the result in the UI; unauthorized results must be filtered server-side.

## Index Consistency

Do not expose newly created or modified content as searchable until its searchable representation is valid.

Do not silently return stale content when the application knows the index is invalid.

## pgvector

Use pgvector for vector storage and retrieval.

The exact vector dimension and indexing strategy are not specified by the PRD and must not be invented without an implementation decision.

## Search Quality

Search relevance must be evaluated against representative company-manual queries.

Do not declare semantic search complete merely because a vector similarity query executes successfully.

## Security

Do not log complete confidential search queries or retrieved company content unnecessarily.

Search infrastructure must follow the application's security and data-protection rules.