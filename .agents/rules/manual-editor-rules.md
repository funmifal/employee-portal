---
trigger: always_on
---

# Manual Editor Rules

## Purpose

The manual editor is the human verification layer between AI-generated content and trusted company documentation.

## Source Traceability

The editor must preserve the relationship between:

- original source image
- extracted OCR text
- compiled content
- manual
- chapter

Users reviewing AI output must be able to reference the original source material.

## AI-Generated Content

AI-generated text is editable.

The editor must not assume that AI output is correct.

The UI and data model must not overwrite the original source image with edited content.

## Human Review

Low-confidence extraction must be easy to identify and correct.

Human corrections must be treated as intentional editorial changes rather than silently rewriting the original OCR source.

## Chapter Organization

The editor must support the PRD requirements for:

- manual editing
- section reordering
- chapter grouping
- reviewing AI-generated content

Do not impose an additional publication hierarchy that is not required by the PRD.

## Ordering

Page and chapter ordering must be explicit.

Do not rely on database insertion order to determine document structure.

## Publishing

Only ADMIN users may publish manuals.

Publishing must not be triggered merely by:

- OCR completion
- compilation completion
- successful AI response

A completed processing state does not equal an approved publication state.

## Viewer Restrictions

VIEWER users must not be able to:

- modify manual content
- reorder sections
- upload source material
- compile drafts
- publish manuals

## Content Integrity

The editor must not silently discard extracted content.

If content is removed or substantially changed during editing, the source material must remain available for reference.

## Rich Text

The editor may use any suitable rich-text implementation unless a specific editor library is selected by the project.

Do not make the architecture dependent on a particular editor library.

## Trust Boundary

The editor is the point where uncertain AI output can become trusted human-reviewed documentation.

The implementation must make this distinction clear.