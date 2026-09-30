````markdown
# AGENTS.md

## 1. What is this project?

This project is an internal employee portal that converts images of handwritten employee notes, whiteboards, brainstorms, and training materials into structured company manuals, SOPs, and reference books.

Build for two user groups:

- Employee / Contributor
- Knowledge Manager / Admin

The initial build must follow the requirements in the **Product Requirements Document (PRD)** provided with this project.

The PRD is the source of truth for:

- Product scope
- User roles
- Functional requirements
- AI processing
- Data model
- Performance requirements
- Security requirements
- Business model
- Risks and mitigations

Do not treat this file as a replacement for the PRD.

Use this file to determine **how the agent must build and behave**.

Do not invent product phases or future features that the PRD does not define.

---

## 2. What is locked?

The following technical choices are locked by the PRD.

### Framework

Use:

- Next.js
- App Router

Do not replace Next.js with another frontend or backend framework.

### Language

Use TypeScript for application code.

Keep type safety enabled.

### Database

Use PostgreSQL.

Use Prisma ORM for database access.

Enable PostgreSQL `pgvector` for vector embeddings and semantic retrieval.

Do not replace PostgreSQL, Prisma, or `pgvector` with another database or ORM.

### Authentication

Use secure session-based authentication through NextAuth or an equivalent session-based middleware as permitted by the PRD.

Do not introduce an insecure custom session system.

### AI and OCR

Build the AI system as a pipeline rather than tying business logic directly to one model.

The PRD requires multimodal AI processing for:

- Handwritten text extraction
- Diagram and bullet hierarchy extraction
- Page sequencing
- Content organization
- Embedding generation
- Confidence scoring

Use enterprise-tier AI endpoints with strict zero-data-retention agreements or self-hosted open-weight vision models where the selected implementation requires external AI processing.

Do not introduce an AI provider or service as a permanent business dependency when the architecture can keep the provider behind an integration boundary.

### File Types

Support:

- JPEG
- PNG
- WebP

Respect the maximum batch size of 50MB.

Do not silently expand the accepted file types or batch limit.

### User Roles

Use exactly these three application roles:

```text
VIEWER
EDITOR
ADMIN
```

Do not invent additional roles unless the PRD is changed.

### Processing States

Use the defined processing states:

```text
PENDING
PROCESSING
FLAGGED_REVIEW
COMPLETED
FAILED
```

Do not create alternate states for the same processing lifecycle without a product requirement.

### Data Model

Use the PRD Prisma data model as the starting schema.

The following entities are defined by the PRD:

- User
- UploadBatch
- ImageItem
- Manual
- Chapter

Preserve the relationships and fields required by the PRD.

---

## 3. What must never happen?

Breaking any rule in this section means the task failed, even if the code builds and the feature appears to work.

### Access Control

Enforce the three RBAC roles on the server.

A `VIEWER` must remain read-only for manuals.

An `EDITOR` may upload and compile drafts but must not receive Admin-only permissions.

An `ADMIN` may publish manuals and manage user roles.

Never rely only on UI visibility to enforce permissions.

Never allow a user to perform an operation simply because the UI exposes the route or action.

### Data Protection

Protect company documentation and uploaded employee material.

Encrypt data at rest and in transit as required by the PRD.

Respect enterprise-controlled retention policies.

Do not expose internal documentation to unauthorized users.

Do not expose uploaded images, OCR text, manuals, or chapters across unauthorized users or roles.

Do not send sensitive company information to an AI service unless the selected endpoint satisfies the enterprise privacy requirement.

### Image Uploads

Only accept the image formats defined by the PRD:

- JPEG
- PNG
- WebP

Never allow an upload batch to exceed 50MB.

Validate uploads before processing them.

Do not begin AI processing on files that fail the required upload validation.

### Processing Integrity

Do not treat uploaded images as already-processed text.

Process images through the defined pipeline:

```text
Ingestion & Preprocessing
        ↓
OCR & Parsing
        ↓
Sequencing
        ↓
Compilation
        ↓
Embedding Generation
        ↓
Confidence Review
```

Do not skip preprocessing when the processing path requires it.

Do not mark processing as complete when required pipeline stages have failed.

Do not hide processing failures from the user.

### OCR Confidence

Flag low-confidence extractions for human review.

Do not silently treat low-confidence OCR as verified company documentation.

Keep the original source image available beside the extracted content in the editor so the reviewer can verify ambiguous text.

This protects the product requirement for human correction of transcription errors.

### AI-Generated Content

Treat AI-generated text, sequencing, structure, and suggestions as untrusted output.

Do not publish AI-generated content as official company documentation without the required human review and Admin publishing permission.

Do not allow AI output to bypass RBAC.

Do not allow AI output to silently overwrite source material.

### Manual Editing

Allow authorized users to review AI-generated text against the original source images.

Allow manual correction of extracted content.

Allow authorized users to reorder sections and group chapters.

Do not destroy the source image merely because its OCR text was edited.

### Publishing

Only an `ADMIN` may publish manuals.

Do not grant publishing permissions to `VIEWER` or `EDITOR`.

Do not infer Admin privileges from frontend state.

### Vector Embeddings

Generate embeddings from processed text chunks for semantic retrieval.

Store embeddings using PostgreSQL `pgvector` as required by the PRD.

Do not replace semantic retrieval with unrelated search behavior when implementing the required semantic search feature.

### User Data Ownership

Scope user-related database access correctly.

Never allow one employee or administrator to access records outside their authorized scope.

Do not trust a client-provided user ID as proof of ownership or permission.

### Processing Performance

Keep the initial OCR and sequencing pipeline within the PRD target of thirty seconds per batch.

Do not introduce unnecessary synchronous work that blocks the request when the work belongs to the processing pipeline.

### Security Boundaries

Keep authentication, authorization, file processing, AI integrations, and database operations behind appropriate server-side boundaries.

Never expose:

- AI API credentials
- Database credentials
- Session secrets
- Enterprise AI credentials
- Internal service credentials

to client-side code.

### Scope Control

Do not build features outside the PRD.

The following are explicitly outside scope:

- Public external document publishing
- Native handwriting tablet hardware
- Stylus integrations
- Real-time collaborative whiteboard drawing

Do not introduce them because they appear technically useful.

---

## 4. How is the work arranged?

Use the following project structure unless an existing project structure already provides the same boundary.

```text
/
├── app/
│   ├── (auth)/
│   ├── (portal)/
│   │   ├── dashboard/
│   │   ├── uploads/
│   │   ├── processing/
│   │   ├── manuals/
│   │   ├── search/
│   │   └── settings/
│   ├── api/
│   │   ├── uploads/
│   │   ├── processing/
│   │   ├── manuals/
│   │   ├── search/
│   │   └── users/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── ui/
│   ├── uploads/
│   ├── processing/
│   ├── editor/
│   ├── manuals/
│   ├── search/
│   └── admin/
│
├── lib/
│   ├── auth/
│   ├── db/
│   ├── uploads/
│   ├── processing/
│   │   ├── preprocessing/
│   │   ├── ocr/
│   │   ├── sequencing/
│   │   ├── compilation/
│   │   └── confidence/
│   ├── ai/
│   │   ├── providers/
│   │   ├── prompts/
│   │   └── validation/
│   ├── embeddings/
│   ├── search/
│   ├── permissions/
│   └── validation/
│
├── jobs/
│   └── document-processing/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── public/
├── types/
├── .env.example
├── package.json
├── tsconfig.json
└── AGENTS.md
```

### Architecture Rules

Keep heavy document processing separate from request handling where the processing workload requires it.

Keep AI provider integrations behind the AI integration boundary.

Keep embedding generation separate from search logic.

Keep authentication and authorization logic reusable.

Keep validation at application boundaries.

Keep database access on the server.

Do not place database queries directly inside presentational UI components.

Do not place AI provider calls directly inside React components.

Do not place file-processing logic inside unrelated UI components.

Keep API handlers thin.

Put business logic in reusable server-side modules.

---

## 5. How should the code look?

Write clean, readable, modern TypeScript.

Use current stable/LTS-compatible tooling and dependencies supported by the project.

Prefer simple code over clever code.

Use strict TypeScript.

Do not use unsafe `any` unless there is no safe alternative and the exception is justified.

Give functions clear names.

Keep functions focused on one responsibility.

Validate external input before using it.

Treat uploaded files, OCR results, AI responses, and search input as untrusted input.

Use shared validation schemas where the same boundary is used in multiple places.

Do not duplicate business rules across API routes and components.

Do not hide important permission checks inside UI code.

Keep server-side business rules authoritative.

Use transactions when multiple related database changes must succeed together.

Do not introduce abstractions without a repeated need.

Do not create large utility files that contain unrelated behavior.

Do not create spaghetti code to make a feature appear complete.

Keep AI provider-specific code isolated so the AI implementation can evolve without changing the rest of the application.

Keep vector-search code isolated from unrelated database operations.

Keep file-processing stages explicit so failures can be identified and handled.

---

## 6. What counts as done?

A task is not done merely because the page renders or the code compiles.

Before declaring work complete, provide a checklist showing which requirements were implemented and verified.

### Product Requirements

- [ ] Single image upload works.
- [ ] Bulk image upload works.
- [ ] JPEG upload works.
- [ ] PNG upload works.
- [ ] WebP upload works.
- [ ] 50MB batch limit is enforced.
- [ ] Processing progress is visible.
- [ ] Image preprocessing works.
- [ ] OCR and parsing work.
- [ ] Page sequencing works.
- [ ] Manual compilation works.
- [ ] Low-confidence results are flagged.
- [ ] Original images are available during review.
- [ ] Manual editing works.
- [ ] Section reordering works.
- [ ] Chapter grouping works.
- [ ] RBAC is enforced.
- [ ] Viewer access is read-only.
- [ ] Editor upload and compilation permissions work.
- [ ] Admin publishing permissions work.
- [ ] Admin user-role management works.
- [ ] Semantic search uses vector embeddings.
- [ ] PostgreSQL `pgvector` is used for embeddings.
- [ ] Enterprise data protection requirements are respected.
- [ ] Initial OCR and sequencing meet the thirty-second batch target.

### Technical Requirements

- [ ] Next.js App Router is used.
- [ ] TypeScript is used.
- [ ] Prisma is used.
- [ ] PostgreSQL is used.
- [ ] `pgvector` is enabled.
- [ ] Session authentication is secure.
- [ ] Server-side authorization is enforced.
- [ ] AI integrations remain behind an appropriate boundary.
- [ ] Secrets remain server-side.
- [ ] Database access is scoped correctly.
- [ ] Input validation exists at relevant boundaries.
- [ ] Processing failures are handled explicitly.
- [ ] The project builds with no errors.
- [ ] No new out-of-scope features were introduced.

### Tests

Write the tests required by the affected feature.

At minimum, cover:

- Authentication
- RBAC permissions
- Cross-user access protection
- Upload validation
- File-size limits
- Processing status transitions
- OCR failure handling
- Low-confidence flagging
- Manual editing
- Chapter ordering
- Publishing permissions
- Embedding generation
- Semantic search
- AI integration failure handling
- Database behavior

Use:

- Unit tests for isolated business logic.
- Integration tests for database, authentication, authorization, processing, and AI boundaries.
- End-to-end tests for critical user workflows.

Run the relevant test suite after implementation.

Run the production build before declaring the task complete.

---

## 7. What does the agent do when unsure?

Do not invent a feature.

Do not invent a role.

Do not invent a workflow.

Do not invent a database field.

Do not invent an AI provider requirement.

Do not invent a publishing rule.

Do not introduce a new product phase.

Do not expand the scope because a feature appears useful.

Use this priority order when making decisions:

1. Explicit user instruction
2. `AGENTS.md`
3. The PRD
4. Existing project architecture
5. The smallest reasonable implementation detail

If the PRD does not define a product decision, do not silently turn a personal preference into a product rule.

If multiple implementation approaches satisfy the requirements, choose the simplest approach that preserves the existing architecture.

Do not solve uncertainty by adding unnecessary abstractions.

Do not solve uncertainty by adding unrelated features.

Do not solve uncertainty with duplicated or tangled code.

If a decision would change product behavior, security, permissions, data ownership, AI processing, or the database model, stop and request clarification rather than inventing the behavior.

When the task is clear, implement only what is required and leave unrelated areas unchanged.
````