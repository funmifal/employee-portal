/**
 * AI pipeline provider boundary.
 *
 * Business logic never calls a specific vendor. It talks to `AIClient`,
 * selected by configuration, so enterprise-grade endpoints (or self-hosted
 * open-weight models) can be wired in behind this boundary without changing
 * processing logic.
 */

export interface OCRResult {
  /** Initially extracted text from a single image. */
  text: string;
  /**
   * 0..1 confidence for the extraction. Values below the pipeline's
   * threshold must be flagged for human review.
   */
  confidence: number;
}

export interface SequenceInput {
  /** Per-image OCR results, keyed by image id. */
  pages: Array<{ imageId: string; text: string }>;
}

export interface SequenceResult {
  /** Image ids in the recommended reading order. */
  orderedImageIds: string[];
}

export interface CompileInput {
  title: string;
  description?: string | null;
  pages: Array<{ imageId: string; text: string }>;
}

export interface CompileResult {
  chapters: Array<{ title: string; content: string }>;
}

export interface AIClient {
  readonly name: string;
  extractText(input: { imageBytes: Uint8Array; imageType: string }): Promise<OCRResult>;
  sequencePages(input: SequenceInput): Promise<SequenceResult>;
  compileManual(input: CompileInput): Promise<CompileResult>;
}