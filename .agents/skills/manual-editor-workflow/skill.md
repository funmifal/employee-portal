
### `.agents/skills/manual-editor-workflow/skill.md`

```markdown
---
name: manual-editor-workflow
description: Use for manual editor, document editor, AI drafts, source-image review, OCR correction, chapter grouping, section reordering, manual editing, human review, and manual publishing.
---

# Manual Editor Workflow Skill

This skill teaches the human-review workflow between AI-generated content and trusted company manuals. Its laws are defined in `manual-editor-rules.md`, `security.md`, and `AGENTS.md`.

## Procedure

1. Load the manual and its related source material.

2. Establish source traceability.
   - Keep the relationship between source image, extracted text, and manual content.

3. Display the AI-generated content for review.
   - Do not present it as automatically verified.

4. Identify low-confidence or ambiguous content.

5. Compare uncertain content against the original source image.

6. Apply human corrections.
   - Preserve the original source image.

7. Organize the content.
   - Group material into chapters.
   - Reorder sections where required.

8. Save the edited manual content.

9. Recheck source traceability after edits.

10. Apply the publishing permission check.
    - Only an `ADMIN` can publish.

11. Publish only after the manual has passed the required human review workflow.

## Code Skeleton

```ts
async function updateChapter(
  chapterId: string,
  content: string,
  userId: string,
) {
  const user = await requireRole(["EDITOR", "ADMIN"]);

  const chapter = await getChapter(chapterId);

  if (!chapter || !userCanAccess(user, chapter)) {
    throw new Error("FORBIDDEN");
  }

  return updateChapterContent(chapterId, content);
}

async function publishManual(manualId: string) {
  await requireRole(["ADMIN"]);

  const manual = await getManual(manualId);

  if (!manual) {
    throw new Error("NOT_FOUND");
  }

  return publishApprovedManual(manualId);
}