/**
 * Content chunking for semantic search.
 *
 * Chunks preserve manual/chapter context by heading when possible and avoid
 * chunks so small they lose meaning or so large that retrieval is imprecise.
 */

export interface ContentChunk {
  manualId: string;
  chapterId: string;
  manualTitle: string;
  chapterTitle: string;
  content: string;
  orderIndex: number;
}

const TARGET_CHARS = 1200;
const MAX_CHARS = 2000;

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function splitParagraph(paragraph: string): string[] {
  if (paragraph.length <= TARGET_CHARS) return [paragraph];
  const chunks: string[] = [];
  const sentences = paragraph.match(/[^\n.!?]+[.!?]+|[^\n.!?]+$/g) ?? [paragraph];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > TARGET_CHARS && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    if ((current + sentence).length > MAX_CHARS) {
      for (let i = 0; i < sentence.length; i += MAX_CHARS) {
        chunks.push(sentence.slice(i, i + MAX_CHARS));
      }
      current = "";
    } else {
      current += sentence;
    }
  }
  if (current.trim().length > 0) chunks.push(current.trim());
  return chunks;
}

/**
 * Split a chapter into searchable chunks carrying full context.
 */
export function chunkChapter(input: {
  manualId: string;
  chapterId: string;
  manualTitle: string;
  chapterTitle: string;
  content: string;
}): ContentChunk[] {
  const paragraphs = splitIntoParagraphs(input.content);
  const chunks: ContentChunk[] = [];
  let order = 0;

  for (const paragraph of paragraphs) {
    for (const piece of splitParagraph(paragraph)) {
      chunks.push({
        manualId: input.manualId,
        chapterId: input.chapterId,
        manualTitle: input.manualTitle,
        chapterTitle: input.chapterTitle,
        content: piece,
        orderIndex: order,
      });
      order += 1;
    }
  }

  return chunks;
}