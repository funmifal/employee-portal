---
trigger: always_on
---

# Note Digitization Pipeline Rules

## Purpose

Define the application's core transformation from physical note images into structured digital knowledge.

## Pipeline Order

The logical pipeline is:

1. Ingestion
2. Image preprocessing
3. OCR and multimodal parsing
4. Automated sequencing
5. Manual/chapter compilation
6. Confidence evaluation and review
7. Embedding generation
8. Semantic retrieval availability

The implementation may orchestrate these stages differently internally, but their responsibilities must remain distinct.

## Ingestion

Validate uploaded images before processing.

Supported formats:

- JPEG
- PNG
- WebP

Respect the PRD's 50MB batch limit.

Do not begin AI processing from an invalid upload.

## Image Preprocessing

Preprocessing may include:

- normalization
- rotation correction
- contrast enhancement

Preprocessing must improve model input quality without destroying the original source image.

Never replace the original uploaded image with a processed derivative.

## OCR and Parsing

The extraction stage must support the product's intended content:

- handwritten text
- diagrams
- bullet hierarchies
- structural relationships

OCR output must remain associated with its source `ImageItem`.

## Sequencing

For bulk uploads, sequencing must consider available:

- temporal context
- structural context
- content continuity

Never assume upload order is always the correct logical page order.

The resulting page order must remain editable/reviewable.

## Confidence

Confidence must be treated as a review signal, not as proof of correctness.

Low-confidence extraction must be capable of being flagged for human review.

Do not silently discard uncertain text.

## Compilation

Compilation must transform extracted content into coherent manual/chapter content without losing traceability to source material.

AI-generated structure must remain editable.

## Failure Handling

A failed stage must be observable.

Do not:

- silently skip failed pages
- mark failed batches as complete
- discard source images
- replace missing content with fabricated text

## Performance

The initial OCR and sequencing target is 30 seconds per batch.

Optimize toward the requirement, but do not sacrifice correctness or data integrity merely to satisfy a timing target.

## Observability

Processing should make it possible to identify which stage failed.

Do not represent an entire multi-stage pipeline as one opaque operation when doing so prevents meaningful diagnosis or recovery.