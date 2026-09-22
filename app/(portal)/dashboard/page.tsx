import { prisma } from "@/lib/db/prisma";
import { ManualStatus, ProcessingStatus } from "@prisma/client";
import Link from "next/link";
import { requireUser } from "@/lib/auth/server";
import { canUploadBatches } from "@/lib/permissions/roles";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireUser();

  const [batchCount, flaggedCount, manualCount, publishedCount, recentBatches] = await Promise.all([
    prisma.uploadBatch.count({ where: { userId: user.id } }),
    prisma.uploadBatch.count({
      where: { status: ProcessingStatus.FLAGGED_REVIEW },
    }),
    prisma.manual.count({
      where: { OR: [{ status: ManualStatus.PUBLISHED }, { authorId: user.id }] },
    }),
    prisma.manual.count({ where: { status: ManualStatus.PUBLISHED } }),
    prisma.uploadBatch.findMany({
      where: { OR: [{ userId: user.id }, { manual: { status: ManualStatus.PUBLISHED } }] },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { images: { select: { id: true } }, manual: { select: { id: true, title: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">Welcome back, {user.name ?? user.email}.</p>
        </div>
        {canUploadBatches(user.role) && (
          <Link
            href="/uploads"
            className="px-4 py-2 bg-[#2f6b5f] hover:bg-[#25564c] text-white text-sm font-medium rounded-lg shadow transition"
          >
            New upload
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My upload batches" value={batchCount} href="/processing" />
        <StatCard label="Flagged for review" value={flaggedCount} href="/processing" />
        <StatCard label="Visible manuals" value={manualCount} href="/manuals" />
        <StatCard label="Published manuals" value={publishedCount} href="/manuals" />
      </div>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Recent batches</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {recentBatches.length === 0 ? (
            <p className="p-5 text-sm text-slate-400 italic">No uploads yet.</p>
          ) : (
            recentBatches.map((batch) => (
              <div key={batch.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {batch.manual?.title ?? "Untitled batch"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {batch.id} · {batch.images.length} image{batch.images.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={batch.status} />
                  <Link
                    href={`/processing/${batch.id}`}
                    className="text-xs text-[#4f8f83] hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-[#4f8f83] transition"
    >
      <p className="text-3xl font-bold text-[#2f6b5f]">{value}</p>
      <p className="text-xs text-slate-600 mt-1">{label}</p>
    </Link>
  );
}