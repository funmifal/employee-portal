/**
 * Prompt templates kept separate from provider logic so they can evolve and
 * be reviewed without touching provider adapters.
 */

export interface OCRPromptInput {
  imageType: string;
}

export function ocrSystemPrompt(): string {
  return [
    "You extract handwritten text, diagrams, and bullet hierarchies from images of physical employee notes.",
    "Return the raw text preserving reading order and list structure.",
    "If a region is illegible, flag low confidence rather than guessing.",
  ].join("\n");
}

export function ocrUserPrompt(input: OCRPromptInput): string {
  return `Extract all text from this ${input.imageType} image.`;
}

export interface SequencePromptInput {
  titles: string[];
}

export function sequenceSystemPrompt(): string {
  return [
    "You order scanned pages into the most logical reading sequence.",
    "Return the page identifiers in reading order.",
  ].join("\n");
}

export function sequenceUserPrompt(input: SequencePromptInput): string {
  return `Order these pages: ${input.titles.join(", ")}.`;
}

export interface CompilePromptInput {
  title: string;
  description?: string | null;
  pageCount: number;
}

export function compileSystemPrompt(): string {
  return [
    "You compile extracted employee notes into an organized company manual.",
    "Group related content into chapters with clear titles.",
    "Do not invent facts that are not present in the source notes.",
    "Mark passages likely to be transcription errors instead of silently fixing them.",
  ].join("\n");
}

export function compileUserPrompt(input: CompilePromptInput): string {
  return `Compile a manual titled "${input.title}"${input.description ? ` with description "${input.description}"` : ""} from ${input.pageCount} pages of extracted notes.`;
}