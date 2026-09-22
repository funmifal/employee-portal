import "server-only";

import { prisma } from "@/lib/db/prisma";
import { Role } from "@prisma/client";
import { canManageUsers } from "@/lib/permissions/roles";
import type { SessionUser } from "@/lib/auth/types";

export class UserAccessError extends Error {}

/**
 * User management (Admin-only).
 */
export async function listUsers(user: SessionUser) {
  if (!canManageUsers(user.role)) throw new UserAccessError("FORBIDDEN");
  return prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}

export async function updateUserRole(userId: string, role: Role, actor: SessionUser) {
  if (!canManageUsers(actor.role)) throw new UserAccessError("FORBIDDEN");

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new UserAccessError("NOT_FOUND");

  // Prevent an admin from de-privileging themselves and locking out the app.
  if (target.id === actor.id && role !== Role.ADMIN) {
    throw new UserAccessError("SELF_DOWNGRADE");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}