import "server-only";

/**
 * Pipeline orchestrator. Runs the defined stages in order:
 *
 *   Ingestion & Preprocessing -> OCR & Parsing -> Sequencing -> Compilation
 *   -> Confidence Review
 *
 * Executes inside a document-processing job so heavy work stays clear of
 * request handling. Images are referenced by their stored keys; the pipeline
 * never carries raw image bytes through the job queue.
 */

import { prisma } from "@/lib/db/prisma";
import { preprocessImages } from "./preprocessing";
import { runOcrStage } from "./ocr";
import { runSequencingStage } from "./sequencing";
import { runCompilationStage } from "./compilation";
import { runConfidenceStage } from "./confidence";
import type { PipelineStage } from "./types";

export interface PipelineJobInput {
  batchId: string;
}

export interface PipelineJobResult {
  stages: PipelineStage[];
  flaggedForReview: boolean;
  orderedImageIds: string[];
  chapterDrafts: Array<{ title: string; content: string }>;
  confidenceCount: number;
  lowConfidenceCount: number;
}

export async function runDocumentProcessingPipeline(
  input: PipelineJobInput
): Promise<PipelineJobResult> {
  const stages: PipelineStage[] = [];

  const batch = await prisma.uploadBatch.findUnique({
    where: { id: input.batchId },
    include: {
      images: { orderBy: { pageOrder: "asc" } },
      manual: { select: { title: true } },
    },
  });

  if (!batch) {
    throw new Error(`Upload batch ${input.batchId} not found`);
  }

  if (batch.images.length === 0) {
    throw new Error(`Upload batch ${input.batchId} has no images`);
  }

  // 1. Ingestion & Preprocessing
  await preprocessImages({
    batchId: batch.id,
    images: batch.images.map((image) => ({
      imageId: image.id,
      storageKey: image.imageUrl,
      type: image.imageUrl.split(".").pop()?.toLowerCase() ?? "jpeg",
    })),
  });
  stages.push("preprocessing");

  // 2. OCR & Parsing
  const ocrResults = await runOcrStage(
    batch.images.map((image) => ({
      imageId: image.id,
      storageKey: image.imageUrl,
      type: image.imageUrl.split(".").pop()?.toLowerCase() ?? "jpeg",
    }))
  );
  stages.push("ocr");

  // Persist OCR text + confidence per image before downstream stages.
  for (const result of ocrResults) {
    await prisma.imageItem.update({
      where: { id: result.imageId },
      data: { ocrText: result.text, confidence: result.confidence },
    });
  }

  // 3. Sequencing
  const { orderedImageIds } = await runSequencingStage({
    pages: ocrResults.map((r) => ({ imageId: r.imageId, text: r.text })),
  });
  stages.push("sequencing");

  // 4. Compilation
  const orderedOcr = orderedImageIds
    .map((id) => ocrResults.find((r) => r.imageId === id))
    .filter((r) => r !== undefined) as typeof ocrResults;
  const { chapters: chapterDrafts } = await runCompilationStage({
    title: batch.manual?.title ?? "Untitled Manual",
    description: null,
    pages: orderedOcr.map((r) => ({ imageId: r.imageId, text: r.text })),
  });
  stages.push("compilation");

  // 5. Confidence Review
  const { flagged } = runConfidenceStage({
    confidences: ocrResults.map((r) => r.confidence),
  });
  stages.push("confidence");

  return {
    stages,
    flaggedForReview: flagged,
    orderedImageIds,
    chapterDrafts,
    confidenceCount: ocrResults.length,
    lowConfidenceCount: ocrResults.filter((r) => r.confidence < 0.6).length,
  };
}