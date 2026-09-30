import { requireRole } from "@/lib/auth/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ManualCreateForm } from "@/components/manuals/manual-create-form";

export const metadata = {
  title: "New manual",
};

export default async function NewManualPage() {
  await requireRole([Role.EDITOR, Role.ADMIN]);

  const batches = await prisma.uploadBatch.findMany({
    where: {
      status: "COMPLETED",
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, manualId: true },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New manual</h1>
        <p className="text-sm text-slate-600 mt-1">
          Create a manual from scratch or from a completed processing batch.
        </p>
      </div>
      <ManualCreateForm batches={batches} />
    </div>
  );
}