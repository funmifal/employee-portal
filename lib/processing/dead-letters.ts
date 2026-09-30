import "server-only";

import { prisma } from "@/lib/db/prisma";
import { JobStatus } from "@prisma/client";
import { Job } from "@prisma/client";

export const MAX_DEAD_LETTERS = 100;

/**
 * Dead letter queue. Every job in DEAD exhausted its retries and needs a
 * human. This is the first place to look when something goes wrong.
 */
export async function listDeadJobs(
  limit = MAX_DEAD_LETTERS
): Promise<Job[]> {
  return prisma.job.findMany({
    where: { status: JobStatus.DEAD },
    orderBy: { updatedAt: "desc" },
    take: Math.min(limit, MAX_DEAD_LETTERS),
  });
}

export class DeadLetterRetryError extends Error {
  code: "NOT_FOUND" | "NOT_DEAD";
  status: number;
  constructor(code: "NOT_FOUND" | "NOT_DEAD", message: string) {
    super(message);
    this.code = code;
    this.status = code === "NOT_FOUND" ? 404 : 409;
  }
}

/**
 * Manually retry one dead letter. Resets the row to PENDING with a fresh
 * attempt budget so the worker picks it up again. The update re-checks
 * status = DEAD, so a double-clicked retry cannot resurrect a job that was
 * already retried (or queued elsewhere).
 */
export async function retryDeadJob(jobId: string): Promise<void> {
  const { count } = await prisma.job.updateMany({
    where: { id: jobId, status: JobStatus.DEAD },
    data: {
      status: JobStatus.PENDING,
      attempts: 0,
      lastError: null,
      runAt: new Date(),
      startedAt: null,
      finishedAt: null,
    },
  });

  if (count === 0) {
    const existing = await prisma.job.findUnique({
      where: { id: jobId },
      select: { status: true },
    });
    if (!existing) {
      throw new DeadLetterRetryError("NOT_FOUND", "Job not found");
    }
    throw new DeadLetterRetryError(
      "NOT_DEAD",
      `Job is not DEAD (current status: ${existing.status})`
    );
  }
}