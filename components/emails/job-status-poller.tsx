"use client";

import { useEffect, useRef, useState } from "react";
import type { JobStatus } from "@prisma/client";
import { JobStatusBadge } from "@/components/emails/job-status-badge";
import {
  isActiveJobStatus,
  isTerminalJobStatus,
} from "@/lib/processing/job-status";

const POLL_INTERVAL_MS = 1200;

interface JobSnapshot {
  id: string;
  status: JobStatus | string;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
}

interface JobSettledError {
  jobId: string;
  message: string;
}

/**
 * Polls GET /api/jobs/:id until the job settles (SUCCEEDED or DEAD), then
 * stops. Status, attempt count and any error are rendered from the endpoint's
 * response — the user watches the real job, never a spinner disconnected from
 * it.
 */
export function JobStatusPoller({ job }: { job: JobSnapshot }) {
  const [status, setStatus] = useState(job.status);
  const [attempts, setAttempts] = useState(job.attempts);
  const [lastError, setLastError] = useState<string | null>(job.lastError);
  const [error, setError] = useState<JobSettledError | null>(null);
  const [settled, setSettled] = useState(isTerminalJobStatus(job.status));
  const settledRef = useRef(settled);

  useEffect(() => {
    if (settledRef.current) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/jobs/${job.id}`, {
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        });
        if (stopped) return;

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          setError({
            jobId: job.id,
            message: body?.error ?? `HTTP ${res.status}`,
          });
        } else {
          const data = (await res.json()) as {
            status: JobStatus | string;
            attempts: number;
            maxAttempts: number;
            lastError: string | null;
          };
          setError(null);
          setStatus(data.status);
          setAttempts(data.attempts);
          setLastError(data.lastError);

          if (isTerminalJobStatus(data.status)) {
            settledRef.current = true;
            setSettled(true);
            return;
          }
        }
      } catch {
        if (!stopped) setError({ jobId: job.id, message: "lost connection to status endpoint" });
      }

      if (!stopped) timer = setTimeout(poll, POLL_INTERVAL_MS);
    }

    timer = setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [job.id]);

  const active = isActiveJobStatus(status);

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-center gap-3">
          <JobStatusBadge status={status} />
          <span className="text-xs text-slate-500">
            attempt {attempts}/{job.maxAttempts}
            {active && <span className="text-[#4f8f83]"> · live (polls /api/jobs/{job.id})</span>}
            {settled && <span className="text-slate-400"> · settled</span>}
          </span>
        </div>
        {lastError && (
          <p className="text-xs text-red-700 font-mono break-all">{lastError}</p>
        )}
        {error && !lastError && (
          <p className="text-xs text-amber-700 font-mono break-all">
            {error.message} — still polling
          </p>
        )}
      </div>
    </div>
  );
}