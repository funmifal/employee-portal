import "server-only";
import type { AIClient, OCRResult, SequenceResult, CompileResult } from "../types";

/**
 * Development-only AI client. It does not call any external service. It is
 * used so the pipeline can be exercised without credentials and makes clear
 * that OCR output is empty/untrusted until a real provider is configured.
 *
 * Production deployments must configure a provider that satisfies the
 * enterprise data-protection requirements in the PRD.
 */
export class DevStubClient implements AIClient {
  readonly name = "dev-stub";

  async extractText(): Promise<OCRResult> {
    return {
      text: "",
      confidence: 0,
    };
  }

  async sequencePages(input: { pages: Array<{ imageId: string; text: string }> }): Promise<SequenceResult> {
    return {
      orderedImageIds: input.pages.map((p) => p.imageId),
    };
  }

  async compileManual(): Promise<CompileResult> {
    return {
      chapters: [
        {
          title: "Extracted Notes",
          content: "",
        },
      ],
    };
  }
}