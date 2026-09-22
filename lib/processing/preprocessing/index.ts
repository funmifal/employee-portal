import "server-only";

/**
 * Ingestion & Preprocessing stage.
 *
 * Confirms each validated, stored image is readable from storage before OCR
 * begins. Images are validated at upload time and never reach this stage
 * unless they passed upload validation.
 */

import { getImageStorage } from "@/lib/uploads/storage";

export interface PreprocessInput {
  batchId: string;
  images: Array<{ imageId: string; storageKey: string; type: string }>;
}

export interface PreprocessResult {
  imageIds: string[];
}

/**
 * Verify stored images are intact and readable before downstream stages.
 */
export async function preprocessImages(input: PreprocessInput): Promise<PreprocessResult> {
  const storage = getImageStorage();
  const imageIds: string[] = [];

  for (const image of input.images) {
    const exists = await storage.exists(image.storageKey);
    if (!exists) {
      throw new Error(`Image ${image.imageId} (${image.storageKey}) is missing from storage`);
    }
    await storage.readImage(image.storageKey);
    imageIds.push(image.imageId);
  }

  return { imageIds };
}