import { z } from "zod";

export const uploadBatchIdentifierSchema = z.object({
  batchId: z.string().trim().min(1),
});

export type UploadBatchIdentifier = z.infer<typeof uploadBatchIdentifierSchema>;

export const createManualSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(2000).optional().nullable(),
  batchIds: z.array(z.string().trim().min(1)).optional(),
});

export type CreateManualInput = z.infer<typeof createManualSchema>;

export const updateManualSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
});

export type UpdateManualInput = z.infer<typeof updateManualSchema>;

export const createChapterSchema = z.object({
  title: z.string().trim().min(1).max(300),
  content: z.string().optional().default(""),
});

export type CreateChapterInput = z.infer<typeof createChapterSchema>;

export const updateChapterSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  content: z.string().optional(),
  orderIndex: z.number().int().optional(),
});

export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;

export const reorderChaptersSchema = z.object({
  orderedChapterIds: z.array(z.string().trim().min(1)).min(1),
});

export type ReorderChaptersInput = z.infer<typeof reorderChaptersSchema>;

export const publishManualSchema = z.object({
  manualId: z.string().trim().min(1),
});

export type PublishManualInput = z.infer<typeof publishManualSchema>;

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(500),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;