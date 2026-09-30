import "server-only";

import { prisma } from "@/lib/db/prisma";
import { embedText } from "@/lib/embeddings/provider";
import { canViewManuals } from "@/lib/permissions/roles";
import type { SessionUser } from "@/lib/auth/types";

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  manualId: string;
  manualTitle: string;
  status: string;
  similarity: number;
}

const RESULT_LIMIT = 20;

/**
 * Semantic search over manual chapters using PostgreSQL pgvector.
 *
 * Authorization is applied on the server: results are filtered so the
 * requesting user can only ever see content they are allowed to read.
 * Published manuals are visible to VIEWER+; drafts are restricted to the
 * manual's author (EDITOR/ADMIN).
 */
export async function searchManualChapters(
  query: string,
  user: SessionUser,
  limit = RESULT_LIMIT
): Promise<SearchResult[]> {
  if (!canViewManuals(user.role)) {
    return [];
  }

  const queryVector = await embedText(query);
  const vectorLiteral = `[${queryVector.join(",")}]`;

  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `
      SELECT
        m."id" AS "manualId",
        m."title" AS "manualTitle",
        m."status" AS "status",
        c."id" AS "chapterId",
        c."title" AS "chapterTitle",
        left(c."content", 300) AS "content",
        1 - (c."embedding" <=> $1::vector) AS "similarity"
      FROM "Chapter" c
      JOIN "Manual" m ON m."id" = c."manualId"
      WHERE c."embedding" IS NOT NULL
        AND (
          m."status" = 'PUBLISHED'
          OR m."authorId" = $2
        )
      ORDER BY c."embedding" <=> $1::vector
      LIMIT $3
    `,
    vectorLiteral,
    user.id,
    limit
  );

  return rows.map((row) => ({
    id: String(row.chapterId),
    title: String(row.chapterTitle),
    content: String(row.content ?? ""),
    manualId: String(row.manualId),
    manualTitle: String(row.manualTitle),
    status: String(row.status),
    similarity: Number(row.similarity),
  }));
}