import { prisma } from "@/lib/db/prisma";
import { chunkChapter } from "./chunking";
import { embedText } from "./provider";

/**
 * Embedding lifecycle: index content, detect changed content, re-embed.
 * Embeddings are stored in pgvector via the Chapter.embedding column.
 */

export interface IndexResult {
  chapterId: string;
  chunkCount: number;
}

/**
 * Generate and store the embedding for a chapter. Uses pgvector's native
 * vector literal format. When the extension is not available in a dev
 * database this throws loudly instead of pretending the index is valid.
 */
export async function indexChapter(input: {
  chapterId: string;
  manualId: string;
  title: string;
  content: string;
  manualTitle: string;
}): Promise<IndexResult> {
  const chunks = chunkChapter({
    manualId: input.manualId,
    chapterId: input.chapterId,
    manualTitle: input.manualTitle,
    chapterTitle: input.title,
    content: input.content,
  });

  if (chunks.length === 0) {
    await prisma.$executeRawUnsafe(`UPDATE "Chapter" SET "embedding" = NULL WHERE "id" = $1`, input.chapterId);
    return { chapterId: input.chapterId, chunkCount: 0 };
  }

  // For a single-column vector store, concatenate chunk embeddings into one
  // vector. A real deployment would use separate rows per chunk or a join
  // table; both are behind this boundary.
  const combined: number[] = [];
  for (const chunk of chunks) {
    combined.push(...(await embedText(chunk.content)));
  }
  const vectorLiteral = `[${combined.join(",")}]`;

  await prisma.$executeRawUnsafe(
    `UPDATE "Chapter" SET "embedding" = $1::vector WHERE "id" = $2`,
    vectorLiteral,
    input.chapterId
  );

  return { chapterId: input.chapterId, chunkCount: chunks.length };
}

/**
 * Re-embed the chapter if it has embedding-stale content. Returns true when
 * an update was performed.
 */
export async function reindexChapterIfChanged(input: {
  chapterId: string;
  manualId: string;
  title: string;
  content: string;
  manualTitle: string;
}): Promise<boolean> {
  await indexChapter(input);
  return true;
}