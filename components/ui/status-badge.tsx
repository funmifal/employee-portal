import { ProcessingStatus, JobStatus } from "@prisma/client";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-300",
  PROCESSING: "bg-blue-100 text-blue-800 border-blue-300",
  FLAGGED_REVIEW: "bg-rose-100 text-rose-800 border-rose-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  FAILED: "bg-red-100 text-red-800 border-red-300",
  SUCCEEDED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  DEAD: "bg-red-800 text-white",
};

export function StatusBadge({
  status,
  ...props
}: { status: ProcessingStatus | JobStatus } & React.HTMLAttributes<HTMLSpanElement>) {
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 border-slate-300";
  return (
    <span
      {...props}
      className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${style}`}
    >
      {status}
    </span>
  );
}