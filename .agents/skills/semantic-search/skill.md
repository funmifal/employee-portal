
### `.agents/skills/semantic-search/skill.md`

```markdown
---
name: semantic-search
description: Use for semantic search, embeddings, vector search, pgvector, content chunking, indexing, re-embedding, retrieval, search results, search authorization, and embedding lifecycle.
---

# Semantic Search Skill

This skill teaches the ordered lifecycle for making manual content searchable through PostgreSQL `pgvector`. Its laws are defined in `semantic-search-rules.md`, `database-schema.md`, `security.md`, and `AGENTS.md`.

## Procedure

1. Identify the manual/chapter content that must be searchable.

2. Prepare the content.
   - Use meaningful content boundaries.
   - Preserve enough chapter/manual context.

3. Split the content into searchable chunks.

4. Generate embeddings using the configured embedding capability.
   - Do not assume the OCR or generative provider must generate them.

5. Validate the generated embedding.

6. Store the embedding with the content it represents.

7. Detect content changes.
   - Identify embeddings that no longer represent current content.

8. Re-embed changed content before exposing the changed content as searchable.

9. Receive a search query.

10. Generate or otherwise prepare the query representation required by the configured semantic-search implementation.

11. Query PostgreSQL `pgvector`.

12. Apply authorization to the retrieved content.
    - Filter out content the requesting user cannot access.

13. Return contextual results that identify the relevant manual/chapter.

## Code Skeleton

```ts
async function indexChapter(chapter: Chapter) {
  const chunks = chunkContent(chapter.content);

  const vectors = await Promise.all(
    chunks.map((chunk) => embeddingProvider.embed(chunk)),
  );

  await storeEmbeddings({
    chapterId: chapter.id,
    chunks,
    vectors,
  });
}

async function searchManuals(query: string, userId: string) {
  const queryVector = await embeddingProvider.embed(query);

  const results = await vectorSearch(queryVector);

  return filterAuthorizedResults(results, userId);
}