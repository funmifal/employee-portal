---
trigger: always_on
---

# Database Schema Rules

## Purpose

Protect the integrity of the data model defined by the PRD.

## Source of Truth

The PRD's Prisma schema is authoritative unless the requirements are explicitly changed.

Do not invent new domain models, relationships, or fields merely because they appear architecturally convenient.

## Core Entities

The current domain consists of:

- User
- UploadBatch
- ImageItem
- Manual
- Chapter

The defined role enum is:

- VIEWER
- EDITOR
- ADMIN

The defined processing status enum is:

- PENDING
- PROCESSING
- FLAGGED_REVIEW
- COMPLETED
- FAILED

## Mandatory Rules

- PostgreSQL is the database.
- Prisma is the ORM.
- pgvector must remain enabled for semantic search.
- Preserve foreign-key relationships between users, batches, images, manuals, and chapters.
- `ImageItem` records must remain associated with their source `UploadBatch`.
- Manual chapters must remain associated with their parent manual.
- Destructive cascades must only be used where explicitly justified by the data relationship.
- Do not delete source images merely because OCR or manual compilation has completed.
- Processing status changes must represent real processing state.
- Do not mark failed or incomplete processing as completed.
- Do not store arbitrary AI output in unrelated database fields.
- Vector embeddings must remain associated with the content they represent.
- Database migrations must preserve existing data unless destructive change is explicitly required and approved.
- Never manually modify production database structure outside the migration strategy.
- Any schema change affecting processing, source traceability, permissions, or search must include corresponding tests.

## PRD Ambiguities

Do not invent implementations for:

- storage provider
- vector dimensions
- vector indexes
- AI provider
- tenant model
- document versioning model

If implementation requires one of these decisions, follow the uncertainty rules in `AGENTS.md`.