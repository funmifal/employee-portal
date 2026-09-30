import "server-only";

/**
 * Compilation stage. Grouped pages become chapters. Compilation output is
 * treated as untrusted AI content and must pass human review before being
 * published (Admin-only).
 */

import { getAIClient } from "@/lib/ai/providers";
import { parseCompileResult } from "@/lib/ai/validation/output";

export interface CompileStageInput {
  title: string;
  description?: string | null;
  pages: Array<{ imageId: string; text: string }>;
}

export interface ChapterDraft {
  title: string;
  content: string;
}

export interface CompileStageResult {
  chapters: ChapterDraft[];
}

export async function runCompilationStage(input: CompileStageInput): Promise<CompileStageResult> {
  const client = getAIClient();
  const raw = await client.compileManual(input);
  const { chapters } = parseCompileResult(raw);
  return { chapters };
}