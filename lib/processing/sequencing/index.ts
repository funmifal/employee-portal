import "server-only";

/**
 * Sequencing stage. Orders pages using the AI client; falls back to the
 * original upload order when the provider is unavailable or returns an
 * invalid ordering.
 */

import { getAIClient } from "@/lib/ai/providers";
import { parseSequenceResult } from "@/lib/ai/validation/output";

export interface SequenceStageInput {
  pages: Array<{ imageId: string; text: string }>;
}

export interface SequenceStageResult {
  orderedImageIds: string[];
}

export async function runSequencingStage(input: SequenceStageInput): Promise<SequenceStageResult> {
  const client = getAIClient();
  try {
    const raw = await client.sequencePages(input);
    const { orderedImageIds } = parseSequenceResult(raw);
    const ids = input.pages.map((p) => p.imageId);
    const valid = orderedImageIds.filter((id) => ids.includes(id));
    if (valid.length === 0) {
      return { orderedImageIds: ids };
    }
    return { orderedImageIds: valid };
  } catch {
    return { orderedImageIds: input.pages.map((p) => p.imageId) };
  }
}