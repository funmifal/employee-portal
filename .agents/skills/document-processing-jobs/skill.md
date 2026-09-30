
### `.agents/skills/document-processing-jobs/skill.md`

```markdown
---
name: document-processing-jobs
description: Use for background processing, processing jobs, batch jobs, asynchronous AI processing, processing queues, retries, job failures, progress updates, processing status, and batch lifecycle.
---

# Document Processing Jobs Skill

This skill teaches the ordered lifecycle for processing uploaded note batches without falsely reporting success. Its laws are defined in `project-status.md`, `note-digitization-pipeline.md`, `ai-pipeline.md`, and `AGENTS.md`.

## Procedure

1. Accept the processing request.
   - Confirm the upload batch exists and is valid.

2. Set the batch to `PROCESSING` when processing actually begins.

3. Execute the processing stages in order.
   - Preprocessing
   - OCR/extraction
   - sequencing
   - compilation
   - confidence evaluation
   - downstream embedding generation

4. Record the result of each stage.
   - Keep failures identifiable by processing stage.

5. Handle temporary failures.
   - Retry only according to a bounded retry strategy.

6. Prevent duplicate processing.
   - A retry must not create duplicate persisted results.

7. Handle low-confidence output.
   - Move the batch to `FLAGGED_REVIEW` when human review is required.

8. Handle unrecoverable failure.
   - Set the batch to `FAILED`.

9. Complete the batch only after required processing succeeds.
   - Set the batch to `COMPLETED`.

10. Expose processing progress from actual state.
    - Do not invent progress merely to make the interface appear active.

## Code Skeleton

```ts
type ProcessingStatus =
  | "PENDING"
  | "PROCESSING"
  | "FLAGGED_REVIEW"
  | "COMPLETED"
  | "FAILED";

async function runDocumentJob(batchId: string) {
  await setStatus(batchId, "PROCESSING");

  try {
    await runStage(batchId, "preprocessing");
    await runStage(batchId, "ocr");
    await runStage(batchId, "sequencing");
    await runStage(batchId, "compilation");

    const confidence = await runConfidenceCheck(batchId);

    if (confidence.requiresReview) {
      await setStatus(batchId, "FLAGGED_REVIEW");
      return;
    }

    await runStage(batchId, "embeddings");
    await setStatus(batchId, "COMPLETED");
  } catch (error) {
    await setStatus(batchId, "FAILED");
    throw error;
  }
}