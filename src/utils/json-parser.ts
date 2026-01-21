/**
 * JSON parsing utilities
 * - Remove markdown code blocks
 * - Parse metadata (tags, project, sprint)
 */

/**
 * Extract JSON from markdown code block
 */
export function extractJsonFromMarkdown(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

export interface ParsedMetadata {
  tags: string[];
  project?: string;
  sprint?: string;
}

/**
 * Parse metadata from AI response (tags, project, sprint)
 * - Object format: { tags: [...], project: "...", sprint: "..." }
 * - Array format fallback: ["tag1", "tag2"]
 */
export function parseMetadata(json: string): ParsedMetadata {
  try {
    const cleaned = extractJsonFromMarkdown(json);

    // Try object format
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      const parsed = JSON.parse(objectMatch[0]);
      return {
        tags: Array.isArray(parsed.tags)
          ? parsed.tags.filter((t: unknown): t is string => typeof t === "string")
          : [],
        project: typeof parsed.project === "string" && parsed.project !== "null" ? parsed.project : undefined,
        sprint: typeof parsed.sprint === "string" && parsed.sprint !== "null" ? parsed.sprint : undefined,
      };
    }

    // Array format fallback
    const arrayMatch = cleaned.match(/\[[\s\S]*?\]/);
    if (arrayMatch) {
      const parsed = JSON.parse(arrayMatch[0]);
      return {
        tags: Array.isArray(parsed)
          ? parsed.filter((t: unknown): t is string => typeof t === "string")
          : [],
      };
    }

    return { tags: [] };
  } catch {
    return { tags: [] };
  }
}

/**
 * Safe JSON parse (returns fallback on failure)
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    const cleaned = extractJsonFromMarkdown(json);
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}
