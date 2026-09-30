import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <p className="text-lg font-semibold text-slate-800">403 — Forbidden</p>
      <p className="text-sm text-slate-600 mt-1">You do not have permission to view this page.</p>
      <Link href="/dashboard" className="mt-4 text-sm text-[#2f6b5f] hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}