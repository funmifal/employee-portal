import "server-only";

import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { getSessionUser } from "./server";
import type { SessionUser } from "./types";
import {
  canViewManuals,
  canUploadBatches,
  canPublishManuals,
  canManageUsers,
} from "@/lib/permissions/roles";

/**
 * Authorization failure payload shared by all API handlers.
 */
export function unauthorizedResponse(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Require an authenticated user in a route handler. Returns either the user
 * or a 401 response. Callers should return the response immediately.
 */
export async function requireApiUser(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  return user;
}

/**
 * Require an authenticated user with the given role(s) in a route handler.
 */
export async function requireApiRole(roles: Role[]): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  if (!roles.includes(user.role)) return forbiddenResponse();
  return user;
}

export async function requireApiViewer(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  return canViewManuals(user.role) ? user : forbiddenResponse();
}

export async function requireApiEditor(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  return canUploadBatches(user.role) ? user : forbiddenResponse();
}

export async function requireApiAdmin(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  return canManageUsers(user.role) ? user : forbiddenResponse();
}

export async function requireApiPublisher(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  return canPublishManuals(user.role) ? user : forbiddenResponse();
}