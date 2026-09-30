import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/server";
import { StatusBadge } from "@/components/ui/status-badge";

export const metadata = {
  title: "Processing",
};

export default async function ProcessingPage() {
  const user = await requireUser();

  const batches = await prisma.uploadBatch.findMany({
    where: { OR: [{ userId: user.id }, { manual: { status: "PUBLISHED" } }] },
    orderBy: { createdAt: "desc" },
    include: {
      images: { select: { id: true } },
      manual: { select: { id: true, title: true, status: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Processing</h1>
        <p className="text-sm text-slate-600 mt-1">Monitor digitization jobs for your uploads.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {batches.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-400 italic">No batches yet.</p>
            <Link href="/uploads" className="text-sm text-[#2f6b5f] hover:underline mt-2 inline-block">
              Upload notes →
            </Link>
          </div>
        ) : (
          batches.map((batch) => (
            <div key={batch.id} className="p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Link
                  href={`/processing/${batch.id}`}
                  className="text-sm font-medium text-slate-800 hover:text-[#2f6b5f] truncate block"
                >
                  {batch.manual?.title ?? "Untitled batch"}
                </Link>
                <p className="text-xs text-slate-500">
                  {batch.images.length} image{batch.images.length === 1 ? "" : "s"} ·{" "}
                  {new Date(batch.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={batch.status} />
                <Link href={`/processing/${batch.id}`} className="text-xs text-[#4f8f83] hover:underline">
                  Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}