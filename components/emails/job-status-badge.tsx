import type { JobStatus } from "@prisma/client";

const STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-300",
  PROCESSING: "bg-blue-100 text-blue-800 border-blue-300 animate-pulse",
  SUCCEEDED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  FAILED: "bg-rose-100 text-rose-800 border-rose-300",
  DEAD: "bg-red-800 text-white border-red-800",
};

export function JobStatusBadge({ status }: { status: JobStatus | string }) {
  const style = STYLE[status] ?? "bg-slate-100 text-slate-700 border-slate-300";
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${style}`}>
      {status}
    </span>
  );
}