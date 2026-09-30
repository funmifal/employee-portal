import { test } from "node:test";
import assert from "node:assert/strict";
import { loginSchema, updateUserRoleSchema } from "../lib/validation/auth";
import {
  createManualSchema,
  createChapterSchema,
  reorderChaptersSchema,
  searchQuerySchema,
} from "../lib/validation/manual";
import { detectImageType, validateUploadBatch, MAX_BATCH_BYTES } from "../lib/uploads/validate";
import { runConfidenceStage, CONFIDENCE_THRESHOLD } from "../lib/processing/confidence";

function u8(bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

// --- auth validation ---

test("login requires a valid email", () => {
  const ok = loginSchema.safeParse({ email: "user@company.com" });
  assert.equal(ok.success, true);
  const bad = loginSchema.safeParse({ email: "not-an-email" });
  assert.equal(bad.success, false);
});

test("role update accepts only valid roles", () => {
  const ok = updateUserRoleSchema.safeParse({ role: "ADMIN" });
  assert.equal(ok.success, true);
  const bad = updateUserRoleSchema.safeParse({ role: "PUBLISHER" });
  assert.equal(bad.success, false);
});

// --- manual validation ---

test("create manual trims title and passes description", () => {
  const ok = createManualSchema.safeParse({ title: "  Copier Manual  ", description: "Overview" });
  assert.equal(ok.success, true);
  if (ok.success) {
    assert.equal(ok.data.title, "Copier Manual");
    assert.equal(ok.data.description, "Overview");
  }
});

test("create chapter requires a title", () => {
  const ok = createChapterSchema.safeParse({ title: "Chapter 1", content: "Text" });
  assert.equal(ok.success, true);
  const bad = createChapterSchema.safeParse({ title: "" });
  assert.equal(bad.success, false);
});

test("reorder requires at least one chapter id", () => {
  const ok = reorderChaptersSchema.safeParse({ orderedChapterIds: ["a", "b", "c"] });
  assert.equal(ok.success, true);
  const bad = reorderChaptersSchema.safeParse({ orderedChapterIds: [] });
  assert.equal(bad.success, false);
});

test("search query must not be empty", () => {
  const ok = searchQuerySchema.safeParse({ q: "paper jam" });
  assert.equal(ok.success, true);
  assert.equal(searchQuerySchema.safeParse({ q: "" }).success, false);
});

// --- upload validation ---

test("detects JPEG, PNG, WebP from magic bytes", () => {
  assert.equal(detectImageType(u8([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(
    detectImageType(u8([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    "image/png"
  );
  assert.equal(
    detectImageType(u8([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])),
    "image/webp"
  );
  assert.equal(detectImageType(u8([0x25, 0x50, 0x44, 0x46])), null);
});

test("rejects files whose magic bytes lie about the extension", () => {
  // Filename says .jpg but content is a PDF header.
  const result = validateUploadBatch([
    { name: "fake.jpg", size: 4, bytes: u8([0x25, 0x50, 0x44, 0x46]) },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].reason, /Unsupported file type/i);
});

test("enforces the 50MB batch cap across all files", () => {
  const jpeg = u8([0xff, 0xd8, 0xff, 0xe0]);
  const oneBigFile = {
    name: "big.jpg",
    size: MAX_BATCH_BYTES,
    bytes: jpeg,
  };
  // Two files that individually fit but together exceed the cap.
  const result = validateUploadBatch([
    { ...oneBigFile, size: MAX_BATCH_BYTES - 1 },
    { ...oneBigFile, size: 2 },
  ]);
  assert.equal(result.files.length, 0);
  assert.match(result.errors.map((e) => e.reason).join(" "), /exceeds the 50MB limit/i);
});

// --- confidence scoring ---

test("flags batch when any image falls below threshold", () => {
  assert.equal(runConfidenceStage({ confidences: [0.9, 0.95] }).flagged, false);
  assert.equal(runConfidenceStage({ confidences: [0.9, 0.1] }).flagged, true);
  assert.equal(runConfidenceStage({ confidences: [] }).flagged, false);
});

test("threshold constant matches exported value", () => {
  assert.equal(CONFIDENCE_THRESHOLD, 0.6);
});