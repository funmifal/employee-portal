import { Role } from "@prisma/client";

/**
 * Server-side RBAC helpers. The UI may also gate controls on these roles, but
 * every protected operation must be re-checked here on the server.
 */

const ROLE_RANK: Record<Role, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
};

export function roleAtLeast(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function canViewManuals(role: Role): boolean {
  return roleAtLeast(role, Role.VIEWER);
}

export function canUploadBatches(role: Role): boolean {
  return roleAtLeast(role, Role.EDITOR);
}

export function canEditDrafts(role: Role): boolean {
  return roleAtLeast(role, Role.EDITOR);
}

export function canPublishManuals(role: Role): boolean {
  return role === Role.ADMIN;
}

export function canManageUsers(role: Role): boolean {
  return role === Role.ADMIN;
}

/** Highest role wins for combined lookup helpers. */
export function maxRole(a: Role, b: Role): Role {
  return ROLE_RANK[a] >= ROLE_RANK[b] ? a : b;
}