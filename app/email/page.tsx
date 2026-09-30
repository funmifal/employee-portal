import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/server";
import { EmailTriggerForm } from "@/components/emails/email-trigger-form";
import { JobStatusPoller } from "@/components/emails/job-status-poller";

export const metadata = {
  title: "Send Email (Job Demo)",
};
export const dynamic = "force-dynamic";

export default async function EmailJobPage() {
  const user = await getSessionUser();

  const jobs = await prisma.job.findMany({
    where: { type: "email-send" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-[#2f6b5f]">
            Job Demo — Email
          </span>
          <div className="text-xs text-slate-500 flex items-center gap-3">
            <span>Signed in as {user?.email ?? "no session (local-dev)"}</span>
            <Link href="/login" className="text-[#4f8f83] hover:underline">
              sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Send email (job demo)</h1>
          <p className="text-sm text-slate-600 mt-1">
            Slow, failure-prone work runs off the request path: this page only enqueues a job and
            returns immediately. The worker sends via Resend. Each row below polls{" "}
            <code className="font-mono">GET /api/jobs/:id</code> for its own status, attempts and
            errors — the spinner you see tracks the real job, never a fake one.
          </p>
        </div>

        <EmailTriggerForm />

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold">Job status ({jobs.length})</h2>
            <span className="text-xs text-slate-400">auto-refreshes</span>
          </div>
          {jobs.length === 0 ? (
            <p className="p-6 text-sm text-slate-400 italic">No email jobs yet. Trigger one above.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <article key={job.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-mono text-slate-800 truncate">{job.id}</span>
                    <span className="text-xs text-slate-500 shrink-0">
                      created {new Date(job.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <JobStatusPoller
                    job={{
                      id: job.id,
                      status: job.status,
                      attempts: job.attempts,
                      maxAttempts: job.maxAttempts,
                      lastError: job.lastError,
                    }}
                  />
                  <PayloadPreview payload={job.payload} />
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="text-xs text-slate-400">
          Worker: <code className="font-mono">npm run worker</code>
        </p>
      </main>
    </div>
  );
}

function PayloadPreview({ payload }: { payload: unknown }) {
  const p = (payload ?? {}) as Record<string, unknown>;
  const to = typeof p.to === "string" ? p.to : "?";
  const subject = typeof p.subject === "string" ? p.subject : "?";
  const requestedBy = typeof p.requestedBy === "string" ? p.requestedBy : "?";
  const fail = p.shouldFail === true;
  return (
    <p className="text-xs text-slate-600">
      to <span className="font-mono">{to}</span> · <span className="font-semibold">{subject}</span>{" "}
      · by {requestedBy}
      {fail && <span className="ml-2 text-amber-700">(simulated failure)</span>}
    </p>
  );
}