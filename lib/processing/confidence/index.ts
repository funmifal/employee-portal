/**
 * Confidence Scoring stage. Per-image OCR confidence decides whether a batch
 * passes straight to COMPLETED or is sent to FLAGGED_REVIEW so a human can
 * verify ambiguous text against the source image.
 */

export const CONFIDENCE_THRESHOLD = 0.6;
export const MIN_FLAG_RATIO = 0; // flag if any image is below threshold

export interface ConfidenceStageInput {
  confidences: number[];
}

export interface ConfidenceStageResult {
  flagged: boolean;
  threshold: number;
}

export function runConfidenceStage(input: ConfidenceStageInput): ConfidenceStageResult {
  const flagged = input.confidences.some((c) => c < CONFIDENCE_THRESHOLD);
  return { flagged, threshold: CONFIDENCE_THRESHOLD };
}