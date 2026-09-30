import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { runDocumentProcessingPipeline } from "@/lib/processing/pipeline";
import { indexChapter } from "@/lib/embeddings";
import type { JobHandlerResult } from "@/lib/processing/worker";

interface DocumentProcessingPayload {
  batchId: string;
}

/**
 * Handler for "document-processing" jobs. Runs the full pipeline and persists
 * results, creating a manual + chapters with embeddings when compilation
 * succeeds. Batches with flagged low-confidence OCR become FLAGGED_REVIEW.
 */
export async function handleDocumentProcessing(payload: DocumentProcessingPayload): Promise<JobHandlerResult> {
  const { batchId } = payload;
  if (!batchId) {
    return { success: false, error: "Missing batchId in job payload" };
  }

  const result = await runDocumentProcessingPipeline({ batchId });

  const flagged = result.flaggedForReview;

  const batch = await prisma.uploadBatch.findUnique({
    where: { id: batchId },
    include: { manual: { include: { chapters: true } } },
  });
  if (!batch) {
    throw new Error(`Upload batch ${batchId} not found while persisting results`);
  }

  let manualId = batch.manualId;
  if (!manualId) {
    const manual = await prisma.manual.create({
      data: {
        title: "Processed Manual",
        authorId: batch.userId,
        batches: { connect: { id: batchId } },
      },
    });
    manualId = manual.id;
  }

  const chapterInputs = await Promise.all(
    result.chapterDrafts.map(async (draft, index) => {
      const existing = batch.manual?.chapters[index];
      const chapter = existing
        ? await prisma.chapter.update({
            where: { id: existing.id },
            data: { title: draft.title, content: draft.content, orderIndex: index },
          })
        : await prisma.chapter.create({
            data: {
              manualId: manualId!,
              title: draft.title,
              content: draft.content,
              orderIndex: index,
            },
          });
      return chapter;
    })
  );

  // Update page order from sequencing results.
  await prisma.$transaction(
    result.orderedImageIds.map((imageId, index) =>
      prisma.imageItem.update({ where: { id: imageId }, data: { pageOrder: index + 1 } })
    )
  );

  // Generate embeddings from compiled chapter content.
  for (const chapter of chapterInputs) {
    const manual = await prisma.manual.findUnique({ where: { id: chapter.manualId } });
    if (!manual) continue;
    await indexChapter({
      chapterId: chapter.id,
      manualId: manual.id,
      title: chapter.title,
      content: chapter.content,
      manualTitle: manual.title,
    });
  }

  await prisma.uploadBatch.update({
    where: { id: batchId },
    data: {
      status: flagged ? "FLAGGED_REVIEW" : "COMPLETED",
      manualId,
    },
  });

  return {
    success: true,
    output: {
      batchId,
      flagged,
      stageCount: result.stages.length,
      chapterCount: chapterInputs.length,
    },
  };
}

export async function enqueueDocumentProcessing(batchId: string) {
  const { enqueueJob } = await import("@/lib/processing/queue");
  return enqueueJob({
    type: "document-processing",
    payload: { batchId } as Prisma.InputJsonValue as Record<string, unknown>,
    idempotencyKey: `document-processing:${batchId}`,
  });
}