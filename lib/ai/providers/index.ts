import "server-only";
import type { AIClient } from "../types";
import { DevStubClient } from "./dev-stub";

export { DevStubClient } from "./dev-stub";
export type { AIClient } from "../types";

let client: AIClient | null = null;

/**
 * Resolve the configured AI client. Selection is driven by the
 * AI_PROVIDER environment variable and stays behind this boundary.
 */
export function getAIClient(): AIClient {
  if (client) return client;

  const provider = process.env.AI_PROVIDER ?? "dev-stub";
  switch (provider) {
    case "dev-stub":
      client = new DevStubClient();
      break;
    default:
      throw new Error(
        `Unsupported AI_PROVIDER: ${provider}. Configure an enterprise provider or use "dev-stub".`
      );
  }
  return client;
}

export const AI_PROVIDER = process.env.AI_PROVIDER ?? "dev-stub";