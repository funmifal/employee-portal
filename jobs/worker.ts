import { JobWorker, registerJobHandler } from "../lib/processing/worker";
import { handleDocumentProcessing } from "./document-processing/handler";
import { handleEmailSend } from "./email-send/handler";

registerJobHandler("document-processing", (job) => {
  const payload = (job.payload ?? {}) as Record<string, unknown>;
  return handleDocumentProcessing({ batchId: String(payload.batchId) });
});

registerJobHandler("email-send", (job) =>
  handleEmailSend(job.payload, job.id, job.idempotencyKey)
);

const intEnv = (name: string, fallback: number, allowZero = false): number => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 0) return fallback;
  if (value === 0 && !allowZero) return fallback;
  return value;
};

const concurrency = intEnv("CONCURRENCY_CAP", 5);
const pollIntervalMs = intEnv("POLL_INTERVAL_MS", 200);
const stuckTimeoutMs = intEnv("STUCK_TIMEOUT_MS", 300_000);
const sweepIntervalMs = intEnv("SWEEP_INTERVAL_MS", 10_000);
const baseBackoffMs = intEnv("BASE_BACKOFF_MS", 1000);
const jitterMs = intEnv("JITTER_MS", 500, true);

const worker = new JobWorker({
  concurrency,
  pollIntervalMs,
  stuckTimeoutMs,
  sweepIntervalMs,
  baseBackoffMs,
  jitterMs,
});

console.log(`[Standalone Worker] Starting background worker process (concurrency: ${concurrency}, poll: ${pollIntervalMs}ms, sweep: every ${sweepIntervalMs}ms, stuck timeout: ${stuckTimeoutMs}ms)...`);
worker.start();

const shutdown = async () => {
  console.log("[Standalone Worker] Shutting down cleanly...");
  await worker.stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
