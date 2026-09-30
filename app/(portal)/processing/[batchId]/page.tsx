import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/server";
import { StatusBadge } from "@/components/ui/status-badge";
import { JobPoller } from "@/components/processing/job-poller";

export const metadata = {
  title: "Batch details",
};

export default async function ProcessingDetailPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const user = await requireUser();
  const { batchId } = await params;

  const batch = await prisma.uploadBatch.findUnique({
    where: { id: batchId },
    include: {
      images: { orderBy: { pageOrder: "asc" } },
      manual: { select: { id: true, title: true, status: true } },
    },
  });

  if (!batch) notFound();
  if (batch.userId !== user.id && batch.manual?.status !== "PUBLISHED") {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
        You do not have access to this batch.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {batch.manual?.title ?? "Untitled batch"}
          </h1>
          <p className="text-xs text-slate-500 font-mono break-all mt-1">{batch.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={batch.status} />
          {batch.manual && (
            <Link href={`/manuals/${batch.manual.id}`} className="text-sm text-[#2f6b5f] hover:underline">
              Open manual →
            </Link>
          )}
        </div>
      </div>

      <JobPoller batchId={batch.id} initialStatus={batch.status} />

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">
            Images ({batch.images.length})
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {batch.images.map((image) => (
            <div key={image.id} className="p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">Page {image.pageOrder}</p>
                <p className="text-xs text-slate-500 font-mono break-all">{image.imageUrl}</p>
                {image.ocrText ? (
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3">{image.ocrText}</p>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-2">No extracted text yet.</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-slate-500">Confidence</p>
                <p
                  className={`text-sm font-semibold ${
                    (image.confidence ?? 0) < 0.6 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {((image.confidence ?? 0) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}