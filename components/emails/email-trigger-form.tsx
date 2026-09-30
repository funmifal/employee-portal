"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EmailTriggerForm() {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [shouldFail, setShouldFail] = useState(false);
  const [enqueueing, setEnqueueing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnqueueing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body, shouldFail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(`Error ${res.status}: ${JSON.stringify(data.error)}`);
        return;
      }
      setMessage(
        `HTTP 202 — enqueued job [${data.job.id}] as ${data.job.status}. The worker sends the email; the row below polls GET /api/jobs/${data.job.id} and updates live.`
      );
      // Bring the new row into the list once; its own poller then tracks it.
      router.refresh();
    } catch (err) {
      setMessage(`Network error: ${String(err)}`);
    } finally {
      setEnqueueing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 max-w-xl">
      <div>
        <label htmlFor="to" className="block text-xs font-medium text-slate-700 mb-1">
          To *
        </label>
        <input
          id="to"
          type="email"
          required
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="someone@example.com"
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2f6b5f]"
        />
      </div>
      <div>
        <label htmlFor="subject" className="block text-xs font-medium text-slate-700 mb-1">
          Subject *
        </label>
        <input
          id="subject"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2f6b5f]"
          placeholder="e.g. Door security policy reminder"
        />
      </div>
      <div>
        <label htmlFor="body" className="block text-xs font-medium text-slate-700 mb-1">
          Body
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2f6b5f] resize-y"
        />
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-700">
        <input
          type="checkbox"
          checked={shouldFail}
          onChange={(e) => setShouldFail(e.target.checked)}
          className="rounded text-[#2f6b5f]"
        />
        Simulate failure (exercises retries → DEAD; no email is sent)
      </label>

      <button
        type="submit"
        disabled={enqueueing || !to.trim() || !subject.trim()}
        className="px-4 py-2.5 bg-[#2f6b5f] hover:bg-[#25564c] text-white text-sm font-medium rounded-lg shadow transition disabled:opacity-50"
      >
        {enqueueing ? "Enqueueing…" : "Enqueue email job"}
      </button>

      {message && (
        <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono break-all text-slate-800">
          {message}
        </div>
      )}
    </form>
  );
}