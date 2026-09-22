import { Role } from "@prisma/client";

/**
 * The authenticated user as exposed to server components, route handlers,
 * and server actions. Never includes secrets or credentials.
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
}