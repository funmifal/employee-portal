import "server-only";

import { prisma } from "@/lib/db/prisma";
import { getImageStorage } from "@/lib/uploads/storage";
import { validateUploadBatch } from "@/lib/uploads/validate";

/**
 * Upload service: validate files, persist to storage, create the batch +
 * image records, then enqueue the processing pipeline job.
 */

export interface UploadServiceFile {
  name: string;
  size: number;
  bytes: Uint8Array;
}

export interface UploadServiceResult {
  batchId: string;
  jobId?: string;
  acceptedCount: number;
  rejected: Array<{ fileId: string | number; reason: string }>;
  status: "PENDING";
}

export async function createUploadBatch(
  userId: string,
  files: UploadServiceFile[]
): Promise<UploadServiceResult> {
  const validation = validateUploadBatch(files);
  const storage = getImageStorage();

  // Create the batch first; on the fallback path we still record the batch
  // even when all files fail validation so the failure is visible.
  const batch = await prisma.uploadBatch.create({
    data: { userId, status: "PENDING" },
  });

  const persisted: Array<{ imageUrl: string; pageOrder: number }> = [];
  for (const file of validation.files) {
    const stored = await storage.saveImage({
      bytes: file.bytes,
      type: file.type,
      originalName: String(file.fileId),
      batchId: batch.id,
    });
    persisted.push({ imageUrl: stored.key, pageOrder: persisted.length + 1 });
  }

  await prisma.imageItem.createMany({
    data: persisted.map((p) => ({
      batchId: batch.id,
      imageUrl: p.imageUrl,
      pageOrder: p.pageOrder,
    })),
  });

  const result: UploadServiceResult = {
    batchId: batch.id,
    acceptedCount: persisted.length,
    rejected: validation.errors,
    status: "PENDING",
  };

  if (persisted.length > 0) {
    const job = await enqueueProcessing(batch.id);
    result.jobId = job.id ?? undefined;
  }

  return result;
}

async function enqueueProcessing(batchId: string) {
  const { enqueueJob } = await import("@/lib/processing/queue");
  return enqueueJob({
    type: "document-processing",
    payload: { batchId },
    idempotencyKey: `document-processing:${batchId}`,
  });
}