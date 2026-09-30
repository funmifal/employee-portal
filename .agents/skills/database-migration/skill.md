
### `.agents/skills/database-migration/skill.md`

```markdown
---
name: database-migration
description: Use for Prisma schema changes, PostgreSQL changes, migrations, database fields, relationships, enums, pgvector, indexes, and database structure changes.
---

# Database Migration Skill

This skill teaches the safe sequence for changing the Prisma/PostgreSQL data model. Its laws are defined in `database-schema.md` and `AGENTS.md`.

## Procedure

1. Identify the required data-model change.
   - Confirm that the change traces to the PRD or an approved requirement.

2. Inspect the current Prisma schema.
   - Check existing models, relations, enums, and pgvector configuration.

3. Make the smallest required schema change.
   - Do not invent unrelated models or fields.

4. Generate the Prisma migration.
   - Keep the schema and migration synchronized.

5. Review the migration.
   - Check for unintended destructive operations.
   - Check that existing relationships and data remain valid.

6. Apply the migration in the intended environment.

7. Regenerate Prisma client artifacts when required by the project setup.

8. Validate the changed data path.
   - Test the affected create, read, update, or delete behavior.

9. Verify related application behavior.
   - Check processing, permissions, source traceability, or search when the change affects them.

## Code Skeleton

```prisma
model Example {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
}