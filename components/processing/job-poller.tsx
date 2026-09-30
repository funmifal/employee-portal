"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";

const ACTIVE_STATUSES = ["PENDING", "PROCESSING"];

interface JobPollerProps {
  batchId: string;
  initialStatus: string;
}

export function JobPoller({ batchId, initialStatus }: JobPollerProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/processing/${batchId}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (stopped) return;
          setStatus(data.batchStatus);
          setJobStatus(data.job?.status ?? null);
          setAttempts(data.job?.attempts ?? 0);
          setLastError(data.job?.lastError ?? null);

          const active =
            ACTIVE_STATUSES.includes(data.batchStatus) ||
            (data.job && ACTIVE_STATUSES.includes(data.job.status));

          if (active) {
            timer = setTimeout(poll, 2000);
          } else {
            router.refresh();
          }
        }
      } catch {
        if (!stopped) timer = setTimeout(poll, 5000);
      }
    }

    if (ACTIVE_STATUSES.includes(status)) {
      timer = setTimeout(poll, 2000);
    }

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [batchId, status, router]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Processing job</span>
        <div className="flex items-center gap-3">
          <StatusBadge status={status as never} />
          {jobStatus && <StatusBadge status={jobStatus as never} />}
        </div>
      </div>

      {ACTIVE_STATUSES.includes(status) && (
        <div className="space-y-2">
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#2f6b5f] animate-pulse rounded-full w-1/3" />
          </div>
          <p className="text-xs text-slate-500">Working… status refreshes every 2 seconds.</p>
        </div>
      )}

      {attempts > 1 && (
        <p className="text-xs text-amber-700">Retry attempts: {attempts}</p>
      )}
      {lastError && (
        <p className="text-xs text-red-700 font-mono break-all">{lastError}</p>
      )}
    </div>
  );
}