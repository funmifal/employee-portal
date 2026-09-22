import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ManualStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth/server";
import { canEditDrafts } from "@/lib/permissions/roles";
import { ChapterEditor } from "@/components/manuals/chapter-editor";

export const metadata = {
  title: "Manual",
};

export default async function ManualDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const manual = await prisma.manual.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, email: true, name: true } },
      chapters: { orderBy: { orderIndex: "asc" } },
      batches: { select: { id: true, status: true } },
    },
  });

  if (!manual) notFound();

  const canRead = manual.status === ManualStatus.PUBLISHED || manual.authorId === user.id;
  if (!canRead) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
        You do not have access to this manual.
      </div>
    );
  }

  const canEdit =
    canEditDrafts(user.role) &&
    manual.status !== ManualStatus.PUBLISHED &&
    (user.role === "ADMIN" || manual.authorId === user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{manual.title}</h1>
          <p className="text-sm text-slate-600 mt-1">
            By {manual.author.name ?? manual.author.email} · {manual.description || "No description"}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`inline-block px-2 py-1 text-xs font-semibold rounded border ${
              manual.status === ManualStatus.PUBLISHED
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : "bg-amber-100 text-amber-800 border-amber-300"
            }`}
          >
            {manual.status}
          </span>
          {canEdit && (
            <PublishButton manualId={manual.id} />
          )}
        </div>
      </div>

      <nav className="text-xs text-slate-500 flex items-center gap-2">
        <Link href="/manuals" className="hover:underline">Manuals</Link>
        <span>/</span>
        <span className="text-slate-700 font-medium">{manual.title}</span>
      </nav>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">
            Chapters ({manual.chapters.length})
          </h2>
          {canEdit && (
            <Link
              href={`/manuals/${manual.id}/chapters/new`}
              className="text-sm text-[#2f6b5f] hover:underline"
            >
              + Add chapter
            </Link>
          )}
        </div>

        {manual.chapters.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-400 italic">
              No chapters yet{(canEdit ? " — add one or wait for a processing job to compile them." : ".")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {manual.chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-medium text-slate-900">
                      {chapter.orderIndex + 1}. {chapter.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Created {new Date(chapter.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  {canEdit ? (
                    <ChapterEditor
                      chapterId={chapter.id}
                      manualId={manual.id}
                      initialTitle={chapter.title}
                      initialContent={chapter.content}
                    />
                  ) : (
                    <div className="prose prose-slate max-w-none text-sm text-slate-700 whitespace-pre-wrap">
                      {chapter.content || "No content."}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PublishButton({ manualId }: { manualId: string }) {
  // Server-side publish via the API route (Publisher/Admin check lives there and in the service).
  return (
    <form action={`/api/manuals/${manualId}/publish`} method="POST">
      <button
        type="submit"
        className="px-3 py-1.5 bg-[#2f6b5f] hover:bg-[#25564c] text-white text-xs font-semibold rounded-lg transition"
      >
        Publish
      </button>
    </form>
  );
}