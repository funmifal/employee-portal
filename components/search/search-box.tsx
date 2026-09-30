"use client";

import { useState } from "react";

interface SearchResult {
  id: string;
  title: string;
  content: string;
  manualId: string;
  manualTitle: string;
  similarity: number;
}

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Search failed");
        setResults(null);
        return;
      }
      setResults(data.results);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. how to reset the copier"
          className="flex-1 px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2f6b5f]"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-[#2f6b5f] hover:bg-[#25564c] text-white text-sm font-medium rounded-lg shadow transition disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {error}
        </div>
      )}

      {results !== null && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No matching chapters.</p>
          ) : (
            results.map((r) => (
              <a
                key={r.id}
                href={`/manuals/${r.manualId}`}
                className="block bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-[#4f8f83] transition"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-medium text-slate-900">{r.title}</h3>
                  <span className="text-xs text-slate-500 shrink-0">
                    {Math.round(r.similarity * 100)}% match
                  </span>
                </div>
                <p className="text-xs text-[#4f8f83] mt-1">{r.manualTitle}</p>
                <p className="text-sm text-slate-600 mt-2 line-clamp-3">{r.content}</p>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}