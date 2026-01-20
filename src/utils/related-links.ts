/**
 * 관련 문서 링크 추가 유틸리티
 */

import type { ContextRepository } from "../repositories/context.repository.js";

export interface RelatedLinksConfig {
  threshold?: number; // 유사도 임계값 (기본: 0.6 = 60%)
  maxLinks?: number;  // 최대 링크 수 (기본: 5)
}

const DEFAULT_CONFIG: Required<RelatedLinksConfig> = {
  threshold: 0.6,
  maxLinks: 5,
};

/**
 * 유사한 문서를 찾아 관련 문서 링크 추가
 */
export async function addRelatedLinks(
  repository: ContextRepository,
  id: string,
  embedding: number[],
  config?: RelatedLinksConfig
): Promise<void> {
  if (!embedding || embedding.length === 0) return;

  const { threshold, maxLinks } = { ...DEFAULT_CONFIG, ...config };

  try {
    const similar = await repository.findSimilar(embedding, maxLinks + 1);
    const related = similar
      .filter((s) => s.id !== id && s.similarity >= threshold)
      .slice(0, maxLinks);

    if (related.length > 0) {
      await repository.appendRelatedLinks(id, related.map((r) => r.id));
    }
  } catch {
    // 관련 문서 링크 실패해도 무시
  }
}
