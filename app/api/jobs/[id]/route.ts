import { retryDeadJob, DeadLetterRetryError } from "@/lib/processing/dead-letters";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: job.id,
      type: job.type,
      payload: job.payload,
      status: job.status,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      lastError: job.lastError,
      runAt: job.runAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      idempotencyKey: job.idempotencyKey,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    // Manual retry of a dead letter: only DEAD rows are requeued (the guard
    // lives in the atomic update below), so this endpoint cannot clobber a
    // job that is already pending/succeeded/processing.
    await retryDeadJob(id);

    return NextResponse.json({
      message: "Job reset to PENDING for retry",
      id,
    });
  } catch (error) {
    if (error instanceof DeadLetterRetryError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Error retrying job:", error);
    return NextResponse.json(
      { error: "Failed to retry job" },
      { status: 500 }
    );
  }
}
