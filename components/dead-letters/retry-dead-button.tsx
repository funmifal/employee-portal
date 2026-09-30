"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RetryDeadButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retry() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="shrink-0 flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={retry}
        disabled={pending}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#2f6b5f] text-white hover:bg-[#285b51] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Retrying…" : "Retry"}
      </button>
      {error && <span className="text-[11px] text-rose-600 max-w-48 text-right">{error}</span>}
    </div>
  );
}