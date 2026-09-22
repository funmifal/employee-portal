"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewChapterForm({ manualId }: { manualId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/manuals/${manualId}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to create chapter");
        return;
      }
      router.push(`/manuals/${manualId}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="chapter-title" className="block text-xs font-medium text-slate-700 mb-1">
          Title *
        </label>
        <input
          id="chapter-title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2f6b5f]"
          placeholder="e.g. Replacing the fuser unit"
        />
      </div>
      <div>
        <label htmlFor="chapter-content" className="block text-xs font-medium text-slate-700 mb-1">
          Content
        </label>
        <textarea
          id="chapter-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2f6b5f] resize-y"
          placeholder="Manual text…"
        />
      </div>
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
        {saving ? "Creating…" : "Create chapter"}
      </button>
    </form>
  );
}