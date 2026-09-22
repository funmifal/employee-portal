"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface UploadResult {
  batchId: string;
  jobId?: string;
  acceptedCount: number;
  rejected: Array<{ fileId: string | number; reason: string }>;
  status: string;
}

export function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(next: File[]) {
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => f.name + f.size));
      const added = next.filter((f) => !seen.has(f.name + f.size));
      return [...prev, ...added];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const form = new FormData();
      for (const file of files) form.append("files", file);

      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = (await res.json()) as UploadResult;
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Upload failed");
        return;
      }
      setResult(data);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setError("Network error during upload");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(Array.from(e.dataTransfer.files));
        }}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${
          dragging ? "border-[#2f6b5f] bg-[#edf7f5]" : "border-slate-300 hover:border-[#4f8f83]"
        }`}
      >
        <p className="text-sm font-medium text-slate-700">
          Drag &amp; drop notes here, or click to browse
        </p>
        <p className="text-xs text-slate-500 mt-1">JPEG · PNG · WebP · 50MB per batch</p>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
        />
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {files.map((file) => (
            <div key={file.name + file.size} className="p-3 flex items-center justify-between">
              <span className="text-sm text-slate-700">{file.name}</span>
              <span className="text-xs text-slate-500">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={files.length === 0 || loading}
        className="px-4 py-2.5 bg-[#2f6b5f] hover:bg-[#25564c] text-white text-sm font-medium rounded-lg shadow transition disabled:opacity-50"
      >
        {loading ? "Uploading…" : `Upload ${files.length} file${files.length === 1 ? "" : "s"}`}
      </button>

      {error && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="p-4 bg-[#edf7f5] border border-[#4f8f83] rounded-xl text-sm space-y-1">
          <p className="font-semibold text-[#2f6b5f]">
            Batch stored — {result.acceptedCount} image{result.acceptedCount === 1 ? "" : "s"} accepted
          </p>
          <p className="text-xs text-slate-600 font-mono break-all">Batch ID: {result.batchId}</p>
          {result.rejected.length > 0 && (
            <ul className="text-xs text-red-700 mt-2 space-y-1">
              {result.rejected.map((r, i) => (
                <li key={i}>
                  {r.fileId}: {r.reason}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => router.push(`/processing/${result.batchId}`)}
            className="mt-2 text-xs font-medium text-[#2f6b5f] hover:underline"
          >
            View processing →
          </button>
        </div>
      )}
    </form>
  );
}