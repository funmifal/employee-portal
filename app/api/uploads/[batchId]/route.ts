import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiUser } from "@/lib/auth/api";

export const runtime = "nodejs";

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
      images: { orderBy: { pageOrder: "asc" } },
      manual: { select: { id: true, title: true, status: true } },
    },
  });

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  // Ownership: users may always see their own batches. Published manual
  // content is readable by any viewer, so allow access in that case too.
  const isOwner = batch.userId === user.id;
  const publishedManual = batch.manual?.status === "PUBLISHED";
  if (!isOwner && !publishedManual) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    batch: {
      id: batch.id,
      status: batch.status,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
      images: batch.images,
      manual: batch.manual,
    },
  });
}