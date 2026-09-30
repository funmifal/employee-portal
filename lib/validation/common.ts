import { z } from "zod";

export const ACCEPTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ACCEPTED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

export const MAX_BATCH_BYTES = 50 * 1024 * 1024; // 50MB

export const requiredEmail = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(320)
  .email("A valid email is required");

export const optionalName = z
  .string()
  .trim()
  .max(200, "Name must be 200 characters or fewer")
  .nullable()
  .optional();

/** File identifier used internally by the processing pipeline. */
export const fileIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[a-zA-Z0-9._-]+$/, "Invalid file identifier");

export const cuidSchema = z.string().trim().min(1).max(64);