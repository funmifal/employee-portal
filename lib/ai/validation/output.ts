import { z } from "zod";
import type { CompileResult, OCRResult, SequenceResult } from "../types";

/**
 * Validation of untrusted AI/OCR output before it is persisted or displayed.
 * AI output is treated as untrusted input.
 */

export const ocrResultSchema = z.object({
  text: z.string().max(1_000_000),
  confidence: z.number().min(0).max(1),
});

export const sequenceResultSchema = z.object({
  orderedImageIds: z.array(z.string().min(1)).max(10_000),
});

export const chapterSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().max(5_000_000),
});

export const compileResultSchema = z.object({
  chapters: z.array(chapterSchema).min(1).max(10_000),
});

export function parseOCRResult(value: unknown): OCRResult {
  return ocrResultSchema.parse(value) as OCRResult;
}

export function parseSequenceResult(value: unknown): SequenceResult {
  return sequenceResultSchema.parse(value) as SequenceResult;
}

export function parseCompileResult(value: unknown): CompileResult {
  return compileResultSchema.parse(value) as CompileResult;
}