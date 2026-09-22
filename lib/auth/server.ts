import "server-only";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import {
  createSessionToken,
  parseSessionToken,
  SESSION_COOKIE_NAME,
} from "./session";
import type { SessionUser } from "./types";

export { SESSION_COOKIE_NAME } from "./session";

function toSessionUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: Role;
}): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

/**
 * Load the user from the request session. Returns null when there is no
 * valid session or the referenced user no longer exists.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = parseSessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) return null;

  return toSessionUser(user);
}

/**
 * Create a signed session cookie for the given user id. Must be called from a
 * Route Handler or Server Action (anywhere the cookies API allows writes).
 */
export async function createUserSession(userId: string) {
  const token = createSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Clear the session cookie.
 */
export async function destroyUserSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Require an authenticated user, otherwise redirect to the login page.
 * Intended for use inside Server Components / pages.
 */
export async function requireUser(options?: { loginPath?: string }): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect(options?.loginPath ?? "/login");
  }
  return user;
}

/**
 * Require an authenticated user with one of the given roles, otherwise
 * redirect to the login page (unauthenticated) or to the forbidden page
 * (authenticated but not allowed).
 */
export async function requireRole(
  roles: Role[],
  options?: { loginPath?: string; forbiddenPath?: string }
): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect(options?.loginPath ?? "/login");
  }
  if (!roles.includes(user.role)) {
    redirect(options?.forbiddenPath ?? "/403");
  }
  return user;
}