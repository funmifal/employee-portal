/**
 * Validation of untrusted uploaded image files.
 *
 * File type is verified from magic bytes rather than trusting the client
 * filename or MIME type. Batch size limits are enforced across the whole
 * batch, not just one file.
 */

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

export const MAX_BATCH_BYTES = 50 * 1024 * 1024; // 50MB
export const MAX_BATCH_FILES = 100;

/** Detect the real image type from leading magic bytes. */
export function detectImageType(buffer: Uint8Array): AcceptedImageType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (buffer.length >= 12 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return "image/webp";
  }
  return null;
}

export interface UploadedFileInput {
  name: string;
  size: number;
  bytes: Uint8Array;
}

export interface UploadError {
  fileId: string | number;
  reason: string;
}

export interface UploadValidationResult {
  ok: boolean;
  files: Array<{ fileId: string | number; type: AcceptedImageType; bytes: Uint8Array }>;
  errors: UploadError[];
  totalBytes: number;
}

/**
 * Validate a batch of image uploads. Rejects disallowed formats, enforces the
 * 50MB batch cap, and reports per-file failures without throwing away the
 * files that did pass validation.
 */
export function validateUploadBatch(files: UploadedFileInput[]): UploadValidationResult {
  const results: UploadValidationResult = {
    ok: true,
    files: [],
    errors: [],
    totalBytes: 0,
  };

  if (files.length > MAX_BATCH_FILES) {
    results.errors.push({
      fileId: "batch",
      reason: `Batch may contain at most ${MAX_BATCH_FILES} files.`,
    });
  }

  // First pass: type from magic bytes + accumulate size for cap enforcement.
  for (const file of files) {
    const type = detectImageType(file.bytes);
    if (!type) {
      results.errors.push({
        fileId: file.name,
        reason: "Unsupported file type. Accepted formats: JPEG, PNG, WebP.",
      });
      continue;
    }
    results.totalBytes += file.size;
    results.files.push({ fileId: file.name, type, bytes: file.bytes });
  }

  if (results.totalBytes > MAX_BATCH_BYTES) {
    results.errors.push({
      fileId: "batch",
      reason: `Batch exceeds the 50MB limit (${results.totalBytes} bytes).`,
    });
    results.files = [];
    results.totalBytes = 0;
  }

  results.ok = results.errors.length === 0;
  return results;
}