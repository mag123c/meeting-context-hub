/**
 * Related document link utility
 */

import type { ContextRepository } from "../repositories/context.repository.js";
import { SIMILARITY_CONFIG } from "../config/constants.js";

export interface RelatedLinksConfig {
  threshold?: number; // Similarity threshold (default: 0.6 = 60%)
  maxLinks?: number;  // Maximum links (default: 5)
}

const DEFAULT_CONFIG: Required<RelatedLinksConfig> = {
  threshold: SIMILARITY_CONFIG.THRESHOLD,
  maxLinks: SIMILARITY_CONFIG.MAX_RELATED_LINKS,
};

/**
 * Find similar documents and add related document links
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
    // Ignore related document link failures
  }
}
