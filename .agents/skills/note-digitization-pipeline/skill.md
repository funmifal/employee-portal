
### `.agents/skills/note-digitization-pipeline/skill.md`

```markdown
---
name: note-digitization-pipeline
description: Use for note digitization, OCR, handwritten notes, whiteboards, image preprocessing, page sequencing, note extraction, document compilation, confidence scoring, and source-image processing.
---

# Note Digitization Pipeline Skill

This skill teaches the ordered transformation of uploaded physical notes into structured digital content. Its laws are defined in `note-digitization-pipeline.md`, `ai-pipeline.md`, and `AGENTS.md`.

## Procedure

1. Accept the upload batch.
   - Validate the supported image types and batch size.

2. Preserve the original images.
   - Create or retain processing derivatives without replacing source images.

3. Preprocess the images.
   - Normalize, rotate, and contrast-enhance where required.

4. Run OCR and multimodal extraction.
   - Extract handwriting, diagrams, bullets, and relevant structure.

5. Attach extracted results to their source images.
   - Preserve `ImageItem` traceability.

6. Sequence bulk uploads.
   - Use available temporal and structural context.
   - Do not assume upload order is logical order.

7. Compile the extracted material.
   - Produce coherent manual/chapter content while retaining source traceability.

8. Evaluate confidence.
   - Identify low-confidence or ambiguous extraction.

9. Flag content requiring human review.

10. Continue to embedding generation only after the content reaches the appropriate downstream processing state.

11. Update processing state according to the actual result.
   - Do not report successful completion after a failed required stage.

## Code Skeleton

```ts
async function processBatch(batchId: string) {
  const images = await getBatchImages(batchId);

  const preprocessed = await preprocessImages(images);

  const extracted = await extractWithAI(preprocessed);

  const sequenced = await sequencePages(extracted);

  const compiled = await compileManualContent(sequenced);

  const confidence = evaluateConfidence(compiled);

  if (confidence.requiresReview) {
    await markForReview(batchId);
    return;
  }

  await saveProcessedContent(batchId, compiled);
  await generateEmbeddings(compiled);
  await markCompleted(batchId);
}