---
name: auth-authorization
description: Use for authentication, authorization, RBAC, roles, permissions, protected routes, protected API operations, ownership checks, Viewer, Editor, Admin, and session access.
---

# Authentication & Authorization Skill

This skill teaches the ordered implementation of authentication and authorization workflows. Its laws are defined in `security.md` and `AGENTS.md`.

## Procedure

1. Identify the protected operation.
   - Determine whether it involves users, uploads, batches, manuals, chapters, search, or administration.

2. Authenticate the request.
   - Resolve the current secure session before accessing protected data.

3. Resolve the effective user.
   - Load the user identity and role needed for the operation.

4. Check authorization.
   - Apply the PRD roles: `VIEWER`, `EDITOR`, and `ADMIN`.
   - Apply ownership checks where the operation is scoped to a user's data.

5. Perform the operation only after authorization succeeds.
   - Never use UI visibility as the authorization mechanism.

6. Test the allowed path.
   - Confirm the correct role can perform the intended operation.

7. Test the denied paths.
   - Confirm unauthorized roles and users cannot perform the operation.

## Code Skeleton

```ts
type Role = "VIEWER" | "EDITOR" | "ADMIN";

async function requireUser() {
  const session = await getSecureSession();

  if (!session?.user?.id) {
    throw new Error("UNAUTHENTICATED");
  }

  return session.user;
}

async function requireRole(allowedRoles: Role[]) {
  const user = await requireUser();

  if (!allowedRoles.includes(user.role as Role)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}

async function performProtectedOperation(resourceId: string) {
  const user = await requireRole(["EDITOR", "ADMIN"]);

  const resource = await getResource(resourceId);

  if (!resource || !userCanAccess(user, resource)) {
    throw new Error("FORBIDDEN");
  }

  return updateResource(resource);
}