import "server-only";

/**
 * OCR & Parsing stage. Text is extracted per image through the AI boundary.
 * Low-confidence results are kept and flagged by the confidence stage.
 */

import { getAIClient } from "@/lib/ai/providers";
import { parseOCRResult } from "@/lib/ai/validation/output";
import { CONFIDENCE_THRESHOLD } from "@/lib/processing/confidence";

export interface OcrImageInput {
  imageId: string;
  storageKey: string;
  type: string;
}

export interface OcrResult {
  imageId: string;
  text: string;
  confidence: number;
  flagged: boolean;
}

export async function runOcrStage(inputs: OcrImageInput[]): Promise<OcrResult[]> {
  const client = getAIClient();
  const storage = (await import("@/lib/uploads/storage")).getImageStorage();
  const results: OcrResult[] = [];

  for (const input of inputs) {
    const imageBytes = await storage.readImage(input.storageKey);
    const raw = await client.extractText({
      imageBytes,
      imageType: input.type,
    });
    const { text, confidence } = parseOCRResult(raw);

    results.push({
      imageId: input.imageId,
      text,
      confidence,
      flagged: confidence < CONFIDENCE_THRESHOLD,
    });
  }

  return results;
}