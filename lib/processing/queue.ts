import { prisma } from "@/lib/db/prisma";
import { JobStatus, Prisma } from "@prisma/client";

export interface EnqueueOptions {
  type: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
  maxAttempts?: number;
  runAt?: Date;
}

export async function enqueueJob(options: EnqueueOptions) {
  const { type, payload, idempotencyKey, maxAttempts = 3, runAt = new Date() } = options;

  if (idempotencyKey) {
    const existingJob = await prisma.job.findUnique({
      where: { idempotencyKey },
    });

    if (existingJob) {
      return existingJob;
    }
  }

  try {
    const job = await prisma.job.create({
      data: {
        type,
        payload: payload as Prisma.InputJsonValue,
        status: JobStatus.PENDING,
        maxAttempts,
        runAt,
        idempotencyKey: idempotencyKey || null,
      },
    });

    return job;
  } catch (error) {
    // Handle database-level idempotency constraint race condition (P2002)
    if (
      idempotencyKey &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingJob = await prisma.job.findUnique({
        where: { idempotencyKey },
      });

      if (existingJob) {
        return existingJob;
      }
    }

    throw error;
  }
}
