"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ManualCreateForm({
  batches,
}: {
  batches: Array<{ id: string; manualId: string | null }>;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/manuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description.trim() ? description : null,
          batchIds: batchIds.length > 0 ? batchIds : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to create manual");
        return;
      }
      router.push(`/manuals/${data.manual.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div>
        <label htmlFor="title" className="block text-xs font-medium text-slate-700 mb-1">
          Title *
        </label>
        <input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2f6b5f]"
          placeholder="e.g. Copier and Fax Troubleshooting"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-xs font-medium text-slate-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2f6b5f] resize-y"
          placeholder="Optional summary of the manual"
        />
      </div>

      {batches.length > 0 && (
        <div>
          <span className="block text-xs font-medium text-slate-700 mb-1">
            Link completed batches
          </span>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {batches
              .filter((b) => !b.manualId)
              .map((batch) => {
                const checked = batchIds.includes(batch.id);
                return (
                  <label
                    key={batch.id}
                    className="flex items-center gap-2 text-sm text-slate-700 p-2 rounded-lg border border-slate-200 cursor-pointer hover:border-[#4f8f83]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setBatchIds((prev) =>
                          checked ? prev.filter((id) => id !== batch.id) : [...prev, batch.id]
                        )
                      }
                    />
                    <span className="font-mono text-xs">{batch.id}</span>
                  </label>
                );
              })}
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving || !title.trim()}
        className="px-4 py-2 bg-[#2f6b5f] hover:bg-[#25564c] text-white text-sm font-medium rounded-lg shadow transition disabled:opacity-50"
      >
        {saving ? "Creating…" : "Create manual"}
      </button>
    </form>
  );
}