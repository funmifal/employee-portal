---
trigger: always_on
---

# Git Conventions

## Purpose

Keep changes traceable, reviewable, and safe for an application that processes company knowledge.

## Mandatory Rules

- Keep commits focused on one logical change.
- Do not combine unrelated feature work, refactoring, dependency upgrades, and schema changes in one commit unless necessary.
- Database schema changes must include their migration.
- Changes to AI pipeline behavior must include corresponding tests where practical.
- Changes to permissions must include authorization tests.
- Do not commit secrets, API keys, uploaded employee images, OCR data, or generated confidential manuals.
- Do not commit local environment files containing credentials.
- Generated artifacts that contain company content must remain outside version control unless explicitly required.
- Do not rewrite shared branch history unless explicitly authorized.
- Do not use force pushes as a normal workflow.
- Review migrations carefully before merging them.
- A change is not complete merely because the application compiles; relevant tests and validation must pass.

## Commit Messages

Commit messages should describe the actual change.

Prefer:

- `feat: add bulk note upload`
- `fix: preserve failed OCR status`
- `feat: add manual chapter editor`
- `fix: restrict viewer manual access`

Avoid vague messages such as:

- `updates`
- `changes`
- `fix stuff`

## Pull Requests

A PR affecting security, database structure, AI processing, or permissions must clearly identify those areas in its description.