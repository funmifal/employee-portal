# Employee Portal

A full-stack internal portal for an employee "operations" team, built with **Next.js (App Router)**
and **PostgreSQL (Prisma)**. Besides the usual CRUD surfaces, the project is built around a
purpose-built **background job system**: jobs are enqueued via the API, executed by a **separate
standalone worker process**, retried with **exponential backoff + jitter**, recovered if the worker
dies mid-job, deduplicated by **idempotency keys** at the database, and supervised through a
**dead letter queue**.

> This is an assignment-driven build. Each system was implemented, tested, and — in
> `docs/job-system-attacks.md` — deliberately broken and verified (with screenshots in
> `docs/evidence/`).

---

## What the app does

The portal gives authenticated employees access to:

- **Dashboard** — landing page after login.
- **Email jobs** (`/email`) — trigger a fake "transactional email" job and watch it move through
  the real background queue in the browser. Polls `GET /api/jobs/:id` until the job settles.
- **Jobs table** (`/jobs`) — read-only table of `Job` rows showing the full status lifecycle
  (PENDING / PROCESSING / SUCCEEDED / FAILED / DEAD) with per-job attempts and errors.
- **Dead letters** (`/dead-letters`) — the dead letter queue: jobs that exhausted retries, with
  the recorded error and a **manual retry** action that requeues them.
- **Uploads / Processing** — batch image uploads (magic-byte validation, 50MB cap, low-resolution
  flagging) tracked by an `UploadBatch`.
- **Manuals** — a CRUD knowledge base (chapters, publishing workflow, role-gated editing).
- **Search** (`/search`) — pgvector similarity search over manual chapters (provider boundary
  currently on `dev-stub` embeddings).
- **Settings** — role management (roles are `ADMIN`, `EDITOR`, `VIEWER`).

Authentication is cookie-based sessions with role-based access control (RBAC); every API route
and page checks permissions through `lib/permissions/`.

---

## The job system (the heart of the project)

Jobs are processed **asynchronously and out-of-process**: the API writes a row and returns
immediately; a separate worker process does the work.

### Lifecycle

```
enqueue ─▶ PENDING ─claim─▶ PROCESSING ─success─▶ SUCCEEDED
                ▲              │  failure (attempts left)
                │              ▼                │
                └──── backoff ─ PENDING          ▼  exhausted
                                    ┌────────▶ DEAD (dead letter)
                                    ▼
                             manual retry ─▶ PENDING
```

### Guarantees (all verified by the attack suite)

| Guarantee | How it works |
|---|---|
| Enqueue is instant | API returns **202** as soon as the row is written; no work happens in-request |
| Idempotency at the DB | `Job.idempotencyKey @unique` — resubmitting the same key/content returns the existing job, exactly one row exists |
| Atomic claim | `FOR UPDATE SKIP LOCKED` in a raw SQL `UPDATE ... RETURNING *` — competing workers can never take the same job (proven with 2 workers over 30 jobs, zero double-claims) |
| Concurrency cap | configurable via `CONCURRENCY_CAP`; claim loop never exceeds it (proven: 50-job burst peaked at exactly N) |
| Retries with backoff | failure → `PENDING` with `runAt = now + BASE_BACKOFF_MS × 2^attempts + random(0..JITTER_MS)`; grows ~2x per attempt (2048ms → 4067ms) |
| Dead letters | `maxAttempts` exhausted → `DEAD`; surfaced in the `/dead-letters` view with guarded manual retry |
| Idempotent work | `JobOutput` registry keyed by `jobId @unique` — completed work is never done twice, even if the job is retried/rerun |
| Stuck-job recovery | the worker sweeps rows stuck in `PROCESSING` longer than `STUCK_TIMEOUT_MS` back to `PENDING` (attempts incremented) — proven by force-killing a worker mid-job and watching recovery |
| Status endpoint | `GET /api/jobs/:id` returns status, attempts, last error, timestamps; the `/email` page polls it live |

**Known constraint:** `Job` time columns are `timestamp without time zone` and readers treat the
literals as UTC wall-clock. The claim uses an explicit `AT TIME ZONE 'UTC'` normalization so a
non-UTC database session (e.g. `Africa/Lagos`) can't skew `startedAt` and break the stuck-job
sweep — a real bug found while attacking the system.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Database | PostgreSQL via Prisma ORM (pgvector used for search) |
| Background job system | custom worker (`jobs/worker.ts`) run as a separate process |
| Email provider | Resend (boundary via `EMAIL_PROVIDER`); the assignment simulates the slow/unreliable API |
| Validation | Zod v4 |
| Sessions | signed Http-only cookie (HMAC via `SESSION_SECRET`) |
| Testing | `node:test` via `tsx` (`npm test`) |

---

## Getting started

### 1. Prerequisites

- Node.js 20+ (developed on 24)
- PostgreSQL running locally
- (optional) a Resend API key for real email; the worker will also simulate failures for demos

### 2. Environment

```bash
cp .env.example .env   # then fill in DATABASE_URL and SESSION_SECRET at minimum
```

Key variables (all documented in `.env.example`):

| Variable | Meaning |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET` | HMAC secret for sign-in cookies (generate a long random hex in production) |
| `AI_PROVIDER` / `EMBEDDING_PROVIDER` / `STORAGE_PROVIDER` | provider boundaries (only `dev-stub` / `local` implemented) |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `EMAIL_PROVIDER` | transactional email provider |
| `CONCURRENCY_CAP` | max jobs a worker claims at once |
| `POLL_INTERVAL_MS` | worker poll cadence |
| `SWEEP_INTERVAL_MS` | how often the stuck-job sweep runs |
| `STUCK_TIMEOUT_MS` | a `PROCESSING` row older than this is considered stuck (must exceed the longest job run) |
| `BASE_BACKOFF_MS` / `JITTER_MS` | retry backoff = `BASE × 2^attempts + rand(0..JITTER)` |

### 3. Database

```bash
npx prisma migrate deploy   # applies committed migrations
npx prisma generate
```

### 4. Run it — two processes

```bash
# terminal 1 — the web app
npm run dev                 # http://localhost:3000

# terminal 2 — the background worker (separate process)
npm run worker
```

Enqueue any email job from `/email` and watch it move through `PENDING → PROCESSING →
SUCCEEDED` (or → retry → `DEAD` if it fails).

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server (`:3000`) |
| `npm run build` | production build |
| `npm run start` | serve the production build |
| `npm run worker` | start the standalone background worker |
| `npm run lint` | ESLint |
| `npm test` | unit tests (`tests/*.test.ts`, 33 passing) |
| `npx tsc --noEmit` | typecheck |

> The worker must be started with the Node flags `--conditions=react-server` (handled by
> `npm run worker`) because shared modules are `server-only`.

---

## Project structure

```
app/
  api/jobs/            POST 202-enqueue + list; GET/POST /api/jobs/[id] status + guarded retry;
                       /api/jobs/dead  dead letter API
  api/emails/          POST 202-enqueue "email-send" job (top-level, unauthenticated by design)
  email/               trigger page with per-job live status pollers
  jobs/                read-only jobs table (full lifecycle)
  dead-letters/        dead letter queue view
  (portal)/            authenticated surfaces (dashboard, uploads, processing, manuals, search, settings)
  (auth)/login/        sign-in
components/            pollers, retry buttons, auth/logout, etc.
jobs/worker.ts         standalone worker entrypoint (reads env, registers the email-send handler)
lib/
  processing/          worker loop, atomic claim, sweep, backoff (pure), output registry,
                       dead-letter helpers, job-status helpers, schema
  email/               idempotent send (DI) for the email job
  db/                  Prisma client
  auth/  permissions/  sessions, RBAC helpers
  search/              pgvector similarity search
prisma/
  schema.prisma        Job, JobOutput, User, UploadBatch, ImageItem, Manual, Chapter, ...
  migrations/          committed SQL migrations
tests/                 unit tests (backoff, idempotent send, job-status, permissions, uploads, ...)
docs/                  PRD, attack/verification record + evidence screenshots
```

---

## API surface (job system)

| Endpoint | Purpose |
|---|---|
| `POST /api/jobs` | Enqueue a job; returns **202** `{ job }`. Accepts optional `idempotencyKey` |
| `GET /api/jobs` | List recent jobs |
| `GET /api/jobs/:id` | Status endpoint: status, attempts/max, lastError, timestamps |
| `POST /api/jobs/:id` | Manual retry — requeues a `DEAD` job (`404` if not found, `409` if not dead) |
| `GET /api/jobs/dead` | Dead letter list |
| `POST /api/emails` | Enqueue an `email-send` job (top-level, no auth — per assignment) |

---

## Documentation

- `docs/job-system-attacks.md` — the "break it on purpose" verification: concurrency cap, 100%
  failure → DEAD, kill-the-worker recovery, idempotency, two-worker contention — with
  **screenshots** in `docs/evidence/`.
- `docs/PRD employee.md` — the product requirement document driving the build.
- `AGENTS.md` / `CLAUDE.md` — agent/rules files for this repository.