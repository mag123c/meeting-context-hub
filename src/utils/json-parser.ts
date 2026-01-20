/**
 * JSON 파싱 유틸리티
 * - 마크다운 코드블록 제거
 * - 메타데이터 파싱 (tags, project, sprint)
 */

/**
 * 마크다운 코드블록에서 JSON 추출
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
 * AI 응답에서 메타데이터 파싱 (tags, project, sprint)
 * - 객체 형식: { tags: [...], project: "...", sprint: "..." }
 * - 배열 형식 폴백: ["tag1", "tag2"]
 */
export function parseMetadata(json: string): ParsedMetadata {
  try {
    const cleaned = extractJsonFromMarkdown(json);

    // 객체 형식 시도
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

    // 배열 형식 폴백
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
 * 안전한 JSON 파싱 (실패 시 폴백 반환)
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    const cleaned = extractJsonFromMarkdown(json);
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}
