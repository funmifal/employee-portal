import { prisma } from "@/lib/db/prisma";
import { JobStatus, Job, Prisma } from "@prisma/client";
import { computeRetryDelayMs } from "@/lib/processing/backoff";

export interface WorkerOptions {
  concurrency?: number;
  pollIntervalMs?: number;
  /** A PROCESSING row older than this (ms) is swept back to PENDING. */
  stuckTimeoutMs?: number;
  /** How often the stuck-job sweep runs (ms). */
  sweepIntervalMs?: number;
  baseBackoffMs?: number;
  /** Upper bound of the uniform random offset added to each backoff. */
  jitterMs?: number;
}

export interface JobHandlerResult {
  success: boolean;
  output?: unknown;
  error?: string;
}

export type JobHandler = (job: Job) => Promise<JobHandlerResult>;

// Registry of job handlers
const handlerRegistry = new Map<string, JobHandler>();

/**
 * Register a job handler for a specific job type.
 */
export function registerJobHandler(type: string, handler: JobHandler) {
  handlerRegistry.set(type, handler);
}

/**
 * Default idempotent dummy job handler for testing & demonstration.
 * Uses the job ID as the output key to ensure idempotency.
 */
export async function defaultJobHandler(job: Job): Promise<JobHandlerResult> {
  const payload = job.payload as Record<string, unknown>;

  // Test knob: make the work take real time so bursts genuinely overlap and
  // the concurrency cap is observable.
  const delayMs = typeof payload?.delayMs === "number" ? payload.delayMs : 0;
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  // Simulate simulated failure if requested in payload for testing
  if (payload && payload.shouldFail === true) {
    throw new Error(`Simulated failure for job ${job.id} (attempt ${job.attempts})`);
  }

  // Idempotent execution: result is uniquely keyed by job.id
  const outputKey = `output_${job.id}`;
  const outputValue = {
    outputKey,
    processedAt: new Date().toISOString(),
    input: payload,
  };

  return {
    success: true,
    output: outputValue,
  };
}

// Register default fallback handler
registerJobHandler("default", defaultJobHandler);
registerJobHandler("document-processing", defaultJobHandler);
registerJobHandler("test-job", defaultJobHandler);

export class JobWorker {
  private concurrency: number;
  private pollIntervalMs: number;
  private stuckTimeoutMs: number;
  private sweepIntervalMs: number;
  private baseBackoffMs: number;
  private jitterMs: number;
  private activeJobsCount = 0;
  private isRunning = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private lastSweepAt = 0;
  public peakConcurrency = 0;

  constructor(options: WorkerOptions = {}) {
    this.concurrency = Math.max(1, options.concurrency ?? 5);
    this.pollIntervalMs = Math.max(10, options.pollIntervalMs ?? 200);
    // Must comfortably exceed the slowest possible run of the job's work
    // (e.g. an external API hang), or a healthy in-flight job would be
    // swept while its worker is still running.
    this.stuckTimeoutMs = options.stuckTimeoutMs ?? 300_000; // 5 minutes
    this.sweepIntervalMs = Math.max(100, options.sweepIntervalMs ?? 10_000);
    this.baseBackoffMs = Math.max(100, options.baseBackoffMs ?? 1000);
    this.jitterMs = Math.max(0, options.jitterMs ?? 500);
  }

  public getActiveCount(): number {
    return this.activeJobsCount;
  }

  /**
   * Start the worker loop.
   */
  public async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[Worker] Started with concurrency limit ${this.concurrency}`);
    this.loop();
  }

  /**
   * Stop the worker loop.
   */
  public async stop() {
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    console.log("[Worker] Stopped.");
  }

  /**
   * Main polling and execution loop.
   */
  private async loop() {
    if (!this.isRunning) return;

    try {
      // 1. Stuck-job sweep (rate-limited): reset PROCESSING rows that have
      //    outlived stuckTimeoutMs, so a worker that died mid-job doesn't
      //    leave the row in PROCESSING forever.
      const now = Date.now();
      if (now - this.lastSweepAt >= this.sweepIntervalMs) {
        this.lastSweepAt = now;
        await this.sweepStuckJobs();
      }

      // 2. Claim available jobs up to concurrency cap
      while (this.isRunning && this.activeJobsCount < this.concurrency) {
        const claimedJob = await this.claimNextJobAtomically();
        if (!claimedJob) break;

        this.activeJobsCount++;
        if (this.activeJobsCount > this.peakConcurrency) {
          this.peakConcurrency = this.activeJobsCount;
        }

        console.log(
          `[Worker] claimed ${claimedJob.id} (concurrency now ${this.activeJobsCount}/${this.concurrency}, peak ${this.peakConcurrency})`
        );

        // Process job asynchronously without blocking loop
        this.processJob(claimedJob).finally(() => {
          this.activeJobsCount--;
          console.log(
            `[Worker] done ${claimedJob.id} (concurrency now ${this.activeJobsCount}/${this.concurrency})`
          );
        });
      }
    } catch (error) {
      console.error("[Worker] Loop error:", error);
    }

    if (this.isRunning) {
      this.pollTimer = setTimeout(() => this.loop(), this.pollIntervalMs);
    }
  }

  /**
   * Sweep: any job stuck in PROCESSING for longer than stuckTimeoutMs (measured
   * from startedAt) is reset to PENDING. The attempt count is incremented — the
   * crashed run counts against the job's retry budget, exactly like a run that
   * threw. runAt is bumped to now so the re-queued job is immediately claimable.
   *
   * The row is washed atomically: a worker can only be sweeping this job if its
   * startedAt is older than the timeout, and the reset update re-checks status
   * and the timeout cutoff, so a healthy in-flight job is never swept.
   */
  public async sweepStuckJobs() {
    const cutoffMs = Date.now() - this.stuckTimeoutMs;
    const cutoff = new Date(cutoffMs);

    const stuckJobs = await prisma.job.findMany({
      where: {
        status: JobStatus.PROCESSING,
        startedAt: { lt: cutoff },
      },
      select: { id: true },
    });
    if (stuckJobs.length === 0) return;

    const reset = await prisma.job.updateMany({
      where: {
        id: { in: stuckJobs.map((j) => j.id) },
        status: JobStatus.PROCESSING,
        startedAt: { lt: cutoff },
      },
      data: {
        status: JobStatus.PENDING,
        attempts: { increment: 1 },
        runAt: new Date(),
        startedAt: null,
        lastError: `Swept: stuck in PROCESSING longer than ${this.stuckTimeoutMs}ms timeout`,
      },
    });
    console.log(`[Worker] Sweep: reset ${reset.count} stuck job(s) to PENDING (attempt count incremented)`);
  }

  /**
   * Atomically claim a single PENDING job using PostgreSQL FOR UPDATE SKIP LOCKED.
   */
  public async claimNextJobAtomically(): Promise<Job | null> {
    const now = new Date();

    // Use Prisma raw query with FOR UPDATE SKIP LOCKED for 100% atomic claiming across multiple workers.
    // The Job time columns are TIMESTAMP WITHOUT TIME ZONE and readers (Prisma ORM, the sweep) treat
    // stored literals as UTC wall-clock. A raw-query Date bind is serialized in the connection's local
    // timezone, so normalize the bound instant to a UTC wall-clock literal via AT TIME ZONE 'UTC';
    // otherwise (e.g. session TZ = UTC+1) the stored startedAt reads one hour in the future and the
    // stuck-job sweep can never match it.
    const utcNow = Prisma.sql`(${now}::timestamp with time zone AT TIME ZONE 'UTC')`;
    const result = await prisma.$queryRaw<Job[]>`
      UPDATE "Job"
      SET 
        "status" = 'PROCESSING'::"JobStatus",
        "startedAt" = ${utcNow},
        "attempts" = "attempts" + 1,
        "updatedAt" = ${utcNow}
      WHERE "id" = (
        SELECT "id"
        FROM "Job"
        WHERE (
          "status" = 'PENDING'::"JobStatus"
          AND "runAt" <= ${utcNow}
        )
        ORDER BY "runAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING *
    `;

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Process a claimed job with error handling, exponential backoff, jitter, and dead letter handling.
   */
  private async processJob(job: Job) {
    const handler = handlerRegistry.get(job.type) || handlerRegistry.get("default") || defaultJobHandler;

    try {
      const result = await handler(job);

      // Successfully processed
      const currentPayload = (job.payload && typeof job.payload === "object" ? job.payload : {}) as Record<string, unknown>;
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.SUCCEEDED,
          finishedAt: new Date(),
          payload: {
            ...currentPayload,
            _output: (result.output ?? null) as Prisma.InputJsonValue,
          } as Prisma.InputJsonObject,
        },
      });
      console.log(`[Worker] Job ${job.id} succeeded on attempt ${job.attempts}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`[Worker] Job ${job.id} failed attempt ${job.attempts}/${job.maxAttempts}: ${errorMessage}`);

      if (job.attempts >= job.maxAttempts) {
        // Reached max attempts: move to DEAD
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: JobStatus.DEAD,
            finishedAt: new Date(),
            lastError: errorMessage,
          },
        });
        console.error(`[Worker] Job ${job.id} is now DEAD after ${job.attempts} attempts`);
      } else {
        // Attempts still below maxAttempts: requeue as PENDING with
        // exponential backoff + random jitter, so a batch that failed together
        // does not retry together against the same failing dependency.
        const retryDelayMs = computeRetryDelayMs({
          baseBackoffMs: this.baseBackoffMs,
          attempts: job.attempts,
          jitterMaxMs: this.jitterMs,
        });
        const nextRunAt = new Date(Date.now() + retryDelayMs);

        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: JobStatus.PENDING,
            runAt: nextRunAt,
            lastError: errorMessage,
          },
        });
        console.log(`[Worker] Job ${job.id} back to PENDING; retry #${job.attempts + 1} scheduled at ${nextRunAt.toISOString()} (delay ${retryDelayMs}ms)`);
      }
    }
  }
}
