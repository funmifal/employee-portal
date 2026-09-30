import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed-cookie session implementation (iron-session style).
 *
 * The session cookie contains a base64url-encoded JSON payload plus an HMAC
 * signature. The signature proves the cookie was issued by this server, so a
 * tampered cookie is rejected without touching the database.
 */

export const SESSION_COOKIE_NAME = "ep_session";

export interface SessionPayload {
  /** User id */
  sub: string;
  /** Expiry (unix seconds) */
  exp: number;
}

const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function getSessionSecret(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is required");
  }
  return Buffer.from(secret);
}

function sign(value: string, key: Buffer): string {
  return createHmac("sha256", key).update(value).digest("base64url");
}

function encodePayload(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json, "utf8").toString("base64url");
}

function decodePayload(value: string): SessionPayload | null {
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as SessionPayload;
    if (typeof parsed.sub !== "string" || typeof parsed.exp !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function createSessionToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: userId,
    exp: now + SESSION_TTL_SECONDS,
  };

  const encoded = encodePayload(payload);
  const key = getSessionSecret();
  const signature = sign(encoded, key);
  return `${encoded}.${signature}`;
}

export function parseSessionToken(token: string): SessionPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;

  const encoded = token.slice(0, dot);
  const providedSignature = token.slice(dot + 1);

  const key = getSessionSecret();
  const expectedSignature = sign(encoded, key);

  const providedBuf = Buffer.from(providedSignature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (providedBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(providedBuf, expectedBuf)) return null;

  const payload = decodePayload(encoded);
  if (!payload) return null;

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) return null;

  return payload;
}