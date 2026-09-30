
### `.agents/skills/ai-provider-integration/skill.md`

```markdown
---
name: ai-provider-integration
description: Use for DeepSeek, Claude, AI providers, provider adapters, AI models, AI APIs, capability checks, provider switching, provider fallback, structured AI responses, and AI integration changes.
---

# AI Provider Integration Skill

This skill teaches how to integrate DeepSeek, Claude, or another approved provider without coupling the product to one vendor. Its laws are defined in `ai-pipeline.md` and `AGENTS.md`.

## Procedure

1. Identify the AI capability required.
   - Examples include vision, OCR, structured extraction, sequencing, compilation, or embeddings.

2. Check provider capability.
   - Confirm that the configured model supports the required input and output behavior.

3. Define or reuse the provider-neutral contract.
   - The core pipeline must depend on the contract, not the provider SDK.

4. Implement the provider adapter.
   - Keep DeepSeek-specific or Claude-specific request handling inside its adapter.

5. Send the normalized request to the configured provider.

6. Normalize the provider response.
   - Convert provider-specific output into the application's expected structure.

7. Validate the normalized response.
   - Reject malformed or incomplete AI output.

8. Handle provider failures.
   - Handle timeout, rate limit, unavailable model, network failure, and invalid response cases.

9. Record useful processing information.
   - Preserve provider/model information needed for observability without logging confidential content.

10. Test provider parity.
    - Confirm that changing from DeepSeek to Claude does not change core business rules.

## Code Skeleton

```ts
type AICapability =
  | "vision"
  | "ocr"
  | "sequencing"
  | "compilation"
  | "embeddings";

interface AIProvider {
  supports(capability: AICapability): boolean;

  process(request: AIRequest): Promise<AIResponse>;
}

interface AIRequest {
  capability: AICapability;
  input: unknown;
}

interface AIResponse {
  output: unknown;
  provider: string;
  model: string;
}

class DeepSeekProvider implements AIProvider {
  supports(capability: AICapability): boolean {
    return capability === "compilation";
  }

  async process(request: AIRequest): Promise<AIResponse> {
    // DeepSeek-specific request/response mapping.
    throw new Error("IMPLEMENT");
  }
}

class ClaudeProvider implements AIProvider {
  supports(capability: AICapability): boolean {
    return capability === "vision" || capability === "compilation";
  }

  async process(request: AIRequest): Promise<AIResponse> {
    // Claude-specific request/response mapping.
    throw new Error("IMPLEMENT");
  }
}