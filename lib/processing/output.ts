import "server-only";

import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import type { JobOutputStore } from "@/lib/email/idempotent-send";

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/**
 * Prisma-backed JobOutputStore. Rows are keyed by job id (`jobId @unique`), so
 * the database constraint itself settles a concurrent-race where two workers
 * recorded the same output: the loser's INSERT fails with P2002 and we fetch
 * the winner's row instead.
 */
export const prismaJobOutputStore: JobOutputStore = {
  async find(jobId) {
    const row = await prisma.jobOutput.findUnique({
      where: { jobId },
      select: { payload: true },
    });
    return row ? (row.payload as Record<string, unknown>) : null;
  },

  async create(jobId, type, payload) {
    try {
      const row = await prisma.jobOutput.create({
        data: {
          jobId,
          type,
          payload: payload as Prisma.InputJsonObject,
        },
      });
      return {
        existed: false,
        payload: row.payload as Record<string, unknown>,
      };
    } catch (error) {
      if (isUniqueViolation(error)) {
        const row = await prisma.jobOutput.findUnique({
          where: { jobId },
        });
        return {
          existed: true,
          payload: (row?.payload ?? payload) as Record<string, unknown>,
        };
      }
      throw error;
    }
  },
};