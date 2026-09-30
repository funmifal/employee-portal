import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { ManualStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth/server";
import { canEditDrafts } from "@/lib/permissions/roles";

export const metadata = {
  title: "Manuals",
};

export default async function ManualsPage() {
  const user = await requireUser();

  const manuals = await prisma.manual.findMany({
    where: { OR: [{ status: ManualStatus.PUBLISHED }, { authorId: user.id }] },
    orderBy: { updatedAt: "desc" },
    include: {
      author: { select: { id: true, email: true, name: true } },
      chapters: { select: { id: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manuals</h1>
          <p className="text-sm text-slate-600 mt-1">
            Digitized and compiled manuals from employee notes.
          </p>
        </div>
        {canEditDrafts(user.role) && (
          <Link
            href="/manuals/new"
            className="px-4 py-2 bg-[#2f6b5f] hover:bg-[#25564c] text-white text-sm font-medium rounded-lg shadow transition"
          >
            New manual
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {manuals.length === 0 ? (
          <p className="p-8 text-sm text-slate-400 italic text-center">
            No manuals yet. Upload notes to start compiling.
          </p>
        ) : (
          manuals.map((manual) => (
            <Link
              key={manual.id}
              href={`/manuals/${manual.id}`}
              className="p-5 block hover:bg-slate-50 transition"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{manual.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    By {manual.author.name ?? manual.author.email} · {manual.chapters.length}{" "}
                    chapter{manual.chapters.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${
                      manual.status === ManualStatus.PUBLISHED
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-amber-100 text-amber-800 border-amber-300"
                    }`}
                  >
                    {manual.status}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}