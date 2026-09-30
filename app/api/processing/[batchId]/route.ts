import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

/**
 * Processing status for a batch: combines the UploadBatch lifecycle status
 * with the most recent document-processing job state.
 */
export async function GET(
  _request: Request,
  props: { params: Promise<{ batchId: string }> }
) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;

  const { batchId } = await props.params;

  const batch = await prisma.uploadBatch.findUnique({
    where: { id: batchId },
    include: {
      images: { orderBy: { pageOrder: "asc" }, select: { id: true, imageUrl: true, ocrText: true, confidence: true, pageOrder: true } },
      manual: { select: { id: true, title: true, status: true } },
    },
  });

  if (!batch) return NextResponse.json({ error: "Batch not found" }, { status: 404 });

  const isOwner = batch.userId === user.id;
  const published = batch.manual?.status === "PUBLISHED";
  if (!isOwner && !published) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const job = await prisma.job.findFirst({
    where: { type: "document-processing", idempotencyKey: `document-processing:${batchId}` },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    batchId: batch.id,
    batchStatus: batch.status,
    manual: batch.manual,
    images: batch.images,
    job: job
      ? {
          id: job.id,
          status: job.status,
          attempts: job.attempts,
          maxAttempts: job.maxAttempts,
          lastError: job.lastError,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        }
      : null,
  });
}