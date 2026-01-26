import type { Context, SearchResult } from '../../types/index.js';

/**
 * Service for finding related contexts using embedding similarity
 */
export class ChainService {
  private readonly defaultThreshold = 0.5;
  private readonly defaultLimit = 5;

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) {
      return 0;
    }

    return dotProduct / magnitude;
  }

  /**
   * Find related contexts by similarity
   */
  findRelated(
    targetEmbedding: Float32Array,
    contexts: Context[],
    options?: {
      excludeId?: string;
      threshold?: number;
      limit?: number;
    }
  ): SearchResult[] {
    const threshold = options?.threshold ?? this.defaultThreshold;
    const limit = options?.limit ?? this.defaultLimit;
    const excludeId = options?.excludeId;

    const results: SearchResult[] = [];

    for (const context of contexts) {
      // Skip if no embedding or excluded
      if (!context.embedding || context.id === excludeId) {
        continue;
      }

      const score = this.cosineSimilarity(targetEmbedding, context.embedding);

      // Only include if above threshold
      if (score >= threshold) {
        results.push({ context, score });
      }
    }

    // Sort by score descending and limit
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Search contexts by query embedding
   */
  searchByEmbedding(
    queryEmbedding: Float32Array,
    contexts: Context[],
    options?: {
      threshold?: number;
      limit?: number;
    }
  ): SearchResult[] {
    const threshold = options?.threshold ?? 0.3; // Lower threshold for search
    const limit = options?.limit ?? 10;

    const results: SearchResult[] = [];

    for (const context of contexts) {
      if (!context.embedding) {
        continue;
      }

      const score = this.cosineSimilarity(queryEmbedding, context.embedding);

      if (score >= threshold) {
        results.push({ context, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
