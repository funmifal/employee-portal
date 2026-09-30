import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { JobStatus } from "@prisma/client";

export const metadata = {
  title: "Jobs Table",
};
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PROCESSING: "bg-sky-100 text-sky-800",
  SUCCEEDED: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-rose-100 text-rose-800",
  DEAD: "bg-red-100 text-red-900",
};

export default async function JobsTablePage() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      type: true,
      status: true,
      attempts: true,
      maxAttempts: true,
      runAt: true,
      startedAt: true,
      finishedAt: true,
      createdAt: true,
      lastError: true,
      idempotencyKey: true,
    },
  });

  const counts = await prisma.job.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const countBy = (status: JobStatus) =>
    counts.find((c) => c.status === status)?._count._all ?? 0;

  const statuses = Object.keys(STATUS_STYLES) as JobStatus[];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-[#2f6b5f]">Jobs Table</span>
          <div className="text-xs text-slate-500 flex items-center gap-3">
            <Link href="/email" className="text-[#4f8f83] hover:underline">
              email jobs
            </Link>
            <Link href="/dead-letters" className="text-[#4f8f83] hover:underline">
              dead letters
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Job table · full status lifecycle</h1>
          <p className="text-sm text-slate-600 mt-1">
            Every row in the{" "}
            <code className="font-mono">Job</code> table, newest first (last 30). The status badge
            shows where each job is in its lifecycle:
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {statuses.map((s) => (
              <span
                key={s}
                className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold ${STATUS_STYLES[s]}`}
              >
                {s} · {countBy(s)}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold">Job rows ({jobs.length} shown)</h2>
            <span className="text-xs text-slate-400">ordered by createdAt desc</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Job id</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Attempts</th>
                <th className="px-4 py-2.5">Created</th>
                <th className="px-4 py-2.5">Finished / Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <tr key={job.id} className="align-top hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                        STATUS_STYLES[job.status]
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 break-all">
                    {job.id}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-slate-600">{job.type}</span>
                    {job.idempotencyKey ? (
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                        key {job.idempotencyKey}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">
                    {job.attempts}/{job.maxAttempts}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[260px]">
                    {job.status === JobStatus.DEAD || job.status === JobStatus.SUCCEEDED ? (
                      <span className="font-mono text-[10px] text-slate-400">
                        {job.finishedAt ? new Date(job.finishedAt).toLocaleString() : "—"}
                      </span>
                    ) : null}
                    {job.lastError ? (
                      <span className="block font-mono text-[10px] text-red-700 break-all mt-1">
                        {job.lastError}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}