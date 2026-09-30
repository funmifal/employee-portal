---
trigger: always_on
---

# Client Archive Rules

## Purpose

Preserve the relationship between original employee source material and the digitized knowledge produced from it.

## Mandatory Rules

- Original uploaded images must not be treated as disposable temporary files merely because OCR has completed.
- Source images must remain traceable to their `ImageItem` and `UploadBatch`.
- OCR text must remain distinguishable from the original image.
- A manual must remain traceable to the upload batch(es) from which it was compiled.
- Do not delete source material as part of normal processing.
- Do not implement automatic archival or deletion policies unless an explicit enterprise retention requirement defines them.
- If retention or deletion is introduced, it must respect enterprise-controlled retention requirements and security rules.
- Destructive deletion must not silently remove source material required to understand or audit a manual.
- Failed processing must not cause automatic loss of the original images.
- Manual editing must not overwrite the original source image.

## Important Boundary

This file does not define a separate archive product, archive UI, or document-versioning system.

If those capabilities become requirements, they must be explicitly added to the product specification.