import { z } from "zod";
import { Role } from "@prisma/client";
import { requiredEmail, optionalName } from "./common";

export const loginSchema = z.object({
  email: requiredEmail,
});

export type LoginInput = z.infer<typeof loginSchema>;

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export const createUserSchema = z.object({
  email: requiredEmail,
  name: optionalName,
  role: z.nativeEnum(Role).default(Role.EDITOR),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;