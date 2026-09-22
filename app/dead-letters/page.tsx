import Link from "next/link";
import { listDeadJobs } from "@/lib/processing/dead-letters";
import { getSessionUser } from "@/lib/auth/server";
import { RetryDeadButton } from "@/components/dead-letters/retry-dead-button";

export const metadata = {
  title: "Dead Letter Queue",
};
export const dynamic = "force-dynamic";

export default async function DeadLettersPage() {
  const user = await getSessionUser();
  const jobs = await listDeadJobs();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-[#2f6b5f]">Dead Letter Queue</span>
          <div className="text-xs text-slate-500 flex items-center gap-3">
            <Link href="/email" className="text-[#4f8f83] hover:underline">
              email jobs
            </Link>
            <span>Signed in as {user?.email ?? "no session (local-dev)"}</span>
            <Link href="/login" className="text-[#4f8f83] hover:underline">
              sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dead letters</h1>
          <p className="text-sm text-slate-600 mt-1">
            Jobs that exhausted their retries. Every row below failed{" "}
            <code className="font-mono">{jobs[0]?.maxAttempts ?? 3}</code> times and needs a human.
            Look here first when something goes wrong. Retry one to requeue it with a fresh attempt
            budget — the worker picks it up immediately.
          </p>
        </div>

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold">Dead letters ({jobs.length})</h2>
            <span className="text-xs text-slate-400">oldest-failure first</span>
          </div>
          {jobs.length === 0 ? (
            <p className="p-6 text-sm text-slate-400 italic">
              Nothing here. The dead letter queue is empty.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <article key={job.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-slate-800 truncate">{job.id}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-mono">
                          {job.type}
                        </span>
                        <span className="text-xs text-slate-500">
                          attempts {job.attempts}/{job.maxAttempts}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        created {new Date(job.createdAt).toLocaleString()} · failed{" "}
                        {job.finishedAt
                          ? new Date(job.finishedAt).toLocaleString()
                          : "?"}
                      </p>
                      <p className="text-[13px] text-red-700 font-mono break-all whitespace-pre-wrap bg-red-50 border border-red-100 rounded px-2 py-1">
                        {job.lastError ?? "no error recorded"}
                      </p>
                    </div>
                    <RetryDeadButton jobId={job.id} />
                  </div>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-slate-400 select-none">
                      payload
                    </summary>
                    <pre className="mt-1 bg-slate-950 text-slate-100 rounded-lg p-3 overflow-x-auto font-mono text-[11px] leading-relaxed">
                      {JSON.stringify(job.payload, null, 2)}
                    </pre>
                  </details>
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="text-xs text-slate-400">
          Retrying requeues as PENDING with attempts reset to 0. If the job already produced an
          output, the idempotency registry (JobOutput) keeps the worker from doing the work twice.
        </p>
      </main>
    </div>
  );
}