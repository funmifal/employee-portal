import "server-only";

import { prisma } from "@/lib/db/prisma";
import { ManualStatus, Prisma } from "@prisma/client";
import { canPublishManuals, canEditDrafts } from "@/lib/permissions/roles";
import type { SessionUser } from "@/lib/auth/types";

/**
 * Manual business logic. RBAC is enforced here, independent of any UI or
 * route-level check.
 */

export class ManualAccessError extends Error {}

function assertCanRead(manual: { authorId: string; status: ManualStatus }, user: SessionUser): boolean {
  // Published manuals are readable by every role. Drafts are restricted to
  // the author (an EDITOR/ADMIN) unless published.
  if (manual.status === ManualStatus.PUBLISHED) return true;
  return manual.authorId === user.id;
}

function assertCanEdit(manual: { authorId: string; status: ManualStatus }, user: SessionUser): boolean {
  if (!canEditDrafts(user.role)) return false;
  // Only the author edits their own drafts; Admins may edit any draft.
  return user.role === "ADMIN" || manual.authorId === user.id;
}

export async function listManuals(user: SessionUser) {
  const manuals = await prisma.manual.findMany({
    where: {
      OR: [{ status: ManualStatus.PUBLISHED }, { authorId: user.id }],
    },
    include: { author: { select: { id: true, email: true, name: true } }, chapters: true },
    orderBy: { updatedAt: "desc" },
  });

  return manuals.map((manual) => ({
    ...manual,
    _access: {
      canRead: true,
      canEdit: assertCanEdit(manual, user),
      canPublish: canPublishManuals(user.role),
    },
  }));
}

export async function getManual(manualId: string, user: SessionUser) {
  const manual = await prisma.manual.findUnique({
    where: { id: manualId },
    include: {
      author: { select: { id: true, email: true, name: true } },
      chapters: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!manual) return null;
  if (!assertCanRead(manual, user)) {
    throw new ManualAccessError("FORBIDDEN");
  }

  return {
    ...manual,
    _access: {
      canEdit: assertCanEdit(manual, user),
      canPublish: canPublishManuals(user.role),
    },
  };
}

export async function createManual(input: {
  title: string;
  description?: string | null;
  batchIds?: string[];
  user: SessionUser;
}) {
  if (!canEditDrafts(input.user.role)) {
    throw new ManualAccessError("FORBIDDEN");
  }

  const data: Prisma.ManualCreateInput = {
    title: input.title,
    description: input.description ?? null,
    author: { connect: { id: input.user.id } },
  };

  if (input.batchIds && input.batchIds.length > 0) {
    data.batches = { connect: input.batchIds.map((id) => ({ id })) };
  }

  return prisma.manual.create({ data });
}

export async function updateManual(
  manualId: string,
  input: { title?: string; description?: string | null },
  user: SessionUser
) {
  const existing = await prisma.manual.findUnique({ where: { id: manualId } });
  if (!existing) throw new ManualAccessError("NOT_FOUND");
  if (!assertCanEdit(existing, user)) throw new ManualAccessError("FORBIDDEN");
  if (existing.status === ManualStatus.PUBLISHED) {
    throw new ManualAccessError("PUBLISHED");
  }

  return prisma.manual.update({
    where: { id: manualId },
    data: { title: input.title, description: input.description },
  });
}

export async function publishManual(manualId: string, user: SessionUser) {
  if (!canPublishManuals(user.role)) throw new ManualAccessError("FORBIDDEN");

  const existing = await prisma.manual.findUnique({ where: { id: manualId } });
  if (!existing) throw new ManualAccessError("NOT_FOUND");

  return prisma.manual.update({
    where: { id: manualId },
    data: { status: ManualStatus.PUBLISHED },
  });
}

export async function createChapter(
  manualId: string,
  input: { title: string; content?: string; orderIndex?: number },
  user: SessionUser
) {
  const existing = await prisma.manual.findUnique({ where: { id: manualId } });
  if (!existing) throw new ManualAccessError("NOT_FOUND");
  if (!assertCanEdit(existing, user)) throw new ManualAccessError("FORBIDDEN");
  if (existing.status === ManualStatus.PUBLISHED) throw new ManualAccessError("PUBLISHED");

  const { _count } = await prisma.chapter.aggregate({
    where: { manualId },
    _count: true,
  });
  const nextOrder = input.orderIndex ?? _count;

  return prisma.chapter.create({
    data: { manualId, title: input.title, content: input.content ?? "", orderIndex: nextOrder },
  });
}

export async function updateChapter(
  chapterId: string,
  input: { title?: string; content?: string; orderIndex?: number },
  user: SessionUser
) {
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) throw new ManualAccessError("NOT_FOUND");

  const manual = await prisma.manual.findUnique({ where: { id: chapter.manualId } });
  if (!manual) throw new ManualAccessError("NOT_FOUND");
  if (!assertCanEdit(manual, user)) throw new ManualAccessError("FORBIDDEN");
  if (manual.status === ManualStatus.PUBLISHED) throw new ManualAccessError("PUBLISHED");

  return prisma.chapter.update({
    where: { id: chapterId },
    data: input,
  });
}

export async function reorderChapters(
  manualId: string,
  orderedChapterIds: string[],
  user: SessionUser
) {
  const existing = await prisma.manual.findUnique({ where: { id: manualId } });
  if (!existing) throw new ManualAccessError("NOT_FOUND");
  if (!assertCanEdit(existing, user)) throw new ManualAccessError("FORBIDDEN");
  if (existing.status === ManualStatus.PUBLISHED) throw new ManualAccessError("PUBLISHED");

  await prisma.$transaction(
    orderedChapterIds.map((chapterId, index) =>
      prisma.chapter.update({ where: { id: chapterId }, data: { orderIndex: index } })
    )
  );

  return prisma.chapter.findMany({
    where: { manualId },
    orderBy: { orderIndex: "asc" },
  });
}