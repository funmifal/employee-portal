# Product Requirements Document: Employee Portal Note Digitization & Manual Compiler

## 1. Product Summary
The employee portal note digitization application is an internal web tool that transforms physical employee notes, whiteboard brainstorms, and training session images into structured, searchable company manuals, standard operating procedures (SOPs), and reference books. Using advanced optical character recognition and multimodal AI pipelines, the system ingests single or bulk image uploads, cleans and sequences the content, and compiles them into cohesive digital publications equipped with semantic search.

## 2. Problem Statement
Organizations lose valuable tacit knowledge captured during physical meetings, training sessions, and whiteboard brainstorming because handwritten notes remain fragmented, unindexed, and difficult to search. Manual transcription is tedious, prone to human error, and rarely integrated into centralized company knowledge bases. This tool automates the transformation of raw imagery into formatted, enterprise-ready digital documentation.

## 3. Goals and Non-Goals
* **Goals:**
  * Enable seamless single or bulk image uploads of handwritten notes and whiteboards.
  * Automate text extraction, sorting, and chapter organization using AI models.
  * Provide an enterprise-grade manual builder with rich-text editing capabilities.
  * Enable semantic search across all compiled manuals using vector embeddings.
* **Non-Goals:**
  * Building a standalone public document publishing platform for external consumers.
  * Providing native physical handwriting tablet hardware or stylus integrations.
  * Supporting real-time collaborative multi-user live drawing on whiteboards.

## 4. User Personas
* **Employee / Contributor:** Staff members who attend training sessions or workshops and need to upload and organize their raw physical notes quickly.
* **Knowledge Manager / Admin:** Department leads who review AI-compiled drafts, correct transcription ambiguities, approve content, and publish official company manuals.

## 5. Functional Requirements
* **Image Upload:** Support drag-and-drop or file selector for single or bulk image uploads (JPEG, PNG, WebP) up to 50MB per batch.
* **AI Processing Dashboard:** Display live progress bars tracking OCR extraction, sorting, and book compilation stages.
* **Manual Editor:** Provide an interface to review AI-generated text alongside original source images, allowing manual edits, section reordering, and chapter grouping.
* **Role-Based Access Control (RBAC):** Enforce strict permissions across three tiers: Viewer (read-only manuals), Editor (upload and compile drafts), and Admin (publish manuals and manage user roles).

## 6. AI Processing Pipeline
* **Ingestion & Preprocessing:** Uploaded images are normalized, rotated, and contrast-enhanced.
* **Optical Character Recognition & Parsing:** Multimodal models extract handwritten text, diagrams, and bullet hierarchies.
* **Automated Sequencing:** The AI analyzes temporal or structural context across bulk uploads to sequence pages logically.
* **Embedding Generation:** Processed text chunks are vectorized using PostgreSQL `pgvector` to support semantic retrieval and search features.
* **Confidence Scoring:** Low-confidence extractions are automatically flagged for human review in the editor dashboard.

## 7. Technical Requirements
* **Stack Architecture:** Next.js (App Router) for frontend and API routes, TypeScript for type safety, Prisma ORM for database interactions, and PostgreSQL with the `pgvector` extension enabled[cite: 1].
* **Performance:** Bulk image batch processing must complete initial OCR and sequencing within thirty seconds per batch.
* **Security:** Data encrypted at rest and in transit, with enterprise-controlled retention policies and secure session management via NextAuth or equivalent middleware.

## 8. Business Model
* **Internal Enterprise Deployment:** Deployed as an internal tool hosted within corporate cloud infrastructure, licensed per corporate deployment or internal tenant usage.

## 9. Risks and Mitigations
* **Risk (Illegible Handwriting):** Poor handwriting quality may cause severe OCR failures.
  * *Mitigation:* Implement automated low-confidence flagging that pairs source images directly beside extracted text in the editor for easy verification.
* **Risk (Data Privacy & IP Leakage):** Sensitive internal documentation processed via third-party AI APIs.
  * *Mitigation:* Utilize enterprise-tier AI endpoints with strict zero-data-retention agreements or self-hosted open-weights vision models.

## 10. Prisma Data Model
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [pgvector]
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

enum Role {
  VIEWER
  EDITOR
  ADMIN
}

enum ProcessingStatus {
  PENDING
  PROCESSING
  FLAGGED_REVIEW
  COMPLETED
  FAILED
}

model User {
  id            String       @id @default(cuid())
  email         String       @unique
  name          String?
  role          Role         @default(EDITOR)
  uploads       UploadBatch[]
  manuals       Manual[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

model UploadBatch {
  id          String           @id @default(cuid())
  userId      String
  user        User             @relation(fields: [userId], references: [id])
  status      ProcessingStatus @default(PENDING)
  images      ImageItem[]
  manualId    String?
  manual      Manual?          @relation(fields: [manualId], references: [id])
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}

model ImageItem {
  id          String      @id @default(cuid())
  batchId     String
  batch       UploadBatch @relation(fields: [batchId], references: [id], onDelete: Cascade)
  imageUrl    String
  ocrText     String?
  confidence  Float?
  pageOrder   Int
  createdAt   DateTime    @default(now())
}

model Manual {
  id          String        @id @default(cuid())
  title       String
  description String?
  authorId    String
  author      User          @relation(fields: [authorId], references: [id])
  batches     UploadBatch[]
  chapters    Chapter[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model Chapter {
  id          String                 @id @default(cuid())
  manualId    String
  manual      Manual                 @relation(fields: [manualId], references: [id], onDelete: Cascade)
  title       String
  content     String                 
  embedding   Unsupported("vector")? 
  orderIndex  Int
  createdAt   DateTime               @default(now())
  updatedAt   DateTime               @updatedAt
}