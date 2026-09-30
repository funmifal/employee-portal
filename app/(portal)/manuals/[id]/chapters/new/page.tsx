import { requireRole } from "@/lib/auth/server";
import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { NewChapterForm } from "@/components/manuals/new-chapter-form";

export const metadata = {
  title: "New chapter",
};

export default async function NewChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole([Role.EDITOR, Role.ADMIN]);
  const { id } = await params;

  const manual = await prisma.manual.findUnique({
    where: { id },
    select: { id: true, title: true, status: true, authorId: true },
  });

  if (!manual) notFound();
  const canEdit =
    manual.status !== "PUBLISHED" && (user.role === "ADMIN" || manual.authorId === user.id);
  if (!canEdit) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
        You do not have permission to add chapters here.
      </div>
    );
  }

  // The form component needs a chapter-like shape; we render inline below.
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">New chapter in “{manual.title}”</h1>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <NewChapterForm manualId={id} />
      </div>
    </div>
  );
}