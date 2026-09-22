import "server-only";

/**
 * Embedding provider boundary. The generative AI provider is NOT assumed to
 * be the embedding provider. Dimension and provider are configuration-driven
 * and must not be hard-coded into business logic.
 */

export interface EmbeddingProvider {
  readonly name: string;
  readonly dimensions: number;
  embed(text: string): Promise<number[]>;
}

let provider: EmbeddingProvider | null = null;

export function getEmbeddingProvider(): EmbeddingProvider {
  if (provider) return provider;

  const name = process.env.EMBEDDING_PROVIDER ?? "dev-stub";
  const dimensions = Number(process.env.EMBEDDING_DIMENSIONS ?? "384");

  switch (name) {
    case "dev-stub":
      provider = new DevStubEmbeddingProvider(dimensions);
      break;
    default:
      throw new Error(
        `Unsupported EMBEDDING_PROVIDER: ${name}. Configure a provider or use "dev-stub".`
      );
  }
  return provider;
}

export async function embedText(text: string): Promise<number[]> {
  return getEmbeddingProvider().embed(text);
}

export function embedTextToString(text: string): Promise<string> {
  return getEmbeddingProvider()
    .embed(text)
    .then((v) => `[${v.join(",")}]`);
}

class DevStubEmbeddingProvider implements EmbeddingProvider {
  readonly name = "dev-stub";
  readonly dimensions: number;

  constructor(dimensions: number) {
    this.dimensions = dimensions;
  }

  async embed(text: string): Promise<number[]> {
    // Deterministic, content-derived vector so re-embedding stays stable
    // enough to exercise the lifecycle without a real provider.
    const vector = new Array<number>(this.dimensions).fill(0);
    for (let i = 0; i < text.length; i++) {
      vector[i % this.dimensions] += text.charCodeAt(i) / 10_000;
    }
    return vector;
  }
}