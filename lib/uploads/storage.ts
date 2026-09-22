import "server-only";
import { mkdir, writeFile, access, readFile, rm } from "node:fs/promises";
import { join, extname } from "node:path";
import { randomUUID } from "node:crypto";
import type { AcceptedImageType } from "./validate";

/**
 * Storage boundary for uploaded images. The local adapter writes to
 * ./uploads on the server filesystem. An S3-compatible adapter can replace
 * this without touching the rest of the application.
 */

export interface StoredImage {
  /** Public-ish identifier used in database records. */
  key: string;
}

export interface ImageStorage {
  saveImage(input: {
    bytes: Uint8Array;
    type: AcceptedImageType;
    originalName: string;
    batchId: string;
  }): Promise<StoredImage>;
  readImage(key: string): Promise<Buffer>;
  deleteImage(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export const UPLOADS_DIR = join(process.cwd(), "uploads");

function extensionForType(type: AcceptedImageType): string {
  switch (type) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
  }
}

class LocalImageStorage implements ImageStorage {
  private rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }

  private resolveBatchDir(batchId: string): string {
    return join(this.rootDir, batchId);
  }

  async saveImage({
    bytes,
    type,
    originalName,
    batchId,
  }: {
    bytes: Uint8Array;
    type: AcceptedImageType;
    originalName: string;
    batchId: string;
  }): Promise<StoredImage> {
    const batchDir = this.resolveBatchDir(batchId);
    await mkdir(batchDir, { recursive: true });
    const safeBase = originalName
      .replace(extname(originalName), "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 80);
    const fileName = `${safeBase || "image"}-${randomUUID()}${extensionForType(type)}`;
    await writeFile(join(batchDir, fileName), Buffer.from(bytes));
    return { key: `${batchId}/${fileName}` };
  }

  async readImage(key: string): Promise<Buffer> {
    const bytes = await readFile(join(this.rootDir, key));
    return bytes;
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(join(this.rootDir, key));
      return true;
    } catch {
      return false;
    }
  }

  async deleteImage(key: string): Promise<void> {
    await rm(join(this.rootDir, key), { force: true });
  }
}

let storage: ImageStorage | null = null;

/**
 * Singleton storage adapter. Storage type is selected by configuration.
 */
export function getImageStorage(): ImageStorage {
  if (storage) return storage;
  const provider = process.env.STORAGE_PROVIDER ?? "local";
  switch (provider) {
    case "local":
      storage = new LocalImageStorage(UPLOADS_DIR);
      break;
    default:
      throw new Error(`Unsupported STORAGE_PROVIDER: ${provider}`);
  }
  return storage;
}