import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { SearchOptions, SearchResult } from '../../types/index.js';
import { EmbeddingService } from '../services/embedding.service.js';
import { ChainService } from '../services/chain.service.js';

export interface SearchContextResult {
  results: SearchResult[];
  method: 'semantic' | 'keyword' | 'hybrid';
}

/**
 * Use case for searching contexts
 */
export class SearchContextUseCase {
  constructor(
    private readonly storage: StorageProvider,
    private readonly embeddingService: EmbeddingService,
    private readonly chainService: ChainService
  ) {}

  /**
   * Search contexts by query
   * Uses semantic search if embeddings available, falls back to keyword search
   */
  async execute(options: SearchOptions): Promise<SearchContextResult> {
    const { query, projectId, limit = 10 } = options;

    // Try semantic search first if embedding service is available
    if (this.embeddingService.isAvailable()) {
      try {
        const queryEmbedding = await this.embeddingService.generateForQuery(query);

        if (queryEmbedding) {
          // Get all contexts with embeddings
          const contexts = await this.storage.listContextsWithEmbeddings(projectId);

          // Search by embedding similarity
          const semanticResults = this.chainService.searchByEmbedding(
            queryEmbedding,
            contexts,
            { limit, threshold: 0.3 }
          );

          // If we have semantic results, return them
          if (semanticResults.length > 0) {
            return {
              results: semanticResults,
              method: 'semantic',
            };
          }
        }
      } catch {
        // Fall through to keyword search
      }
    }

    // Fallback to keyword search
    const keywordResults = await this.storage.searchByKeyword(query, {
      projectId,
      limit,
    });

    return {
      results: keywordResults.map(context => ({
        context,
        score: 1.0, // Keyword matches don't have a similarity score
      })),
      method: 'keyword',
    };
  }

  /**
   * Find contexts related to a given context
   */
  async findRelated(
    contextId: string,
    options?: { limit?: number; threshold?: number }
  ): Promise<SearchResult[]> {
    const context = await this.storage.getContext(contextId);
    if (!context || !context.embedding) {
      return [];
    }

    // Get all contexts with embeddings
    const contexts = await this.storage.listContextsWithEmbeddings(context.projectId ?? undefined);

    // Find related contexts
    return this.chainService.findRelated(
      context.embedding,
      contexts,
      {
        excludeId: contextId,
        limit: options?.limit ?? 5,
        threshold: options?.threshold ?? 0.5,
      }
    );
  }

  /**
   * Find contexts related to a given embedding
   */
  async findRelatedByEmbedding(
    embedding: Float32Array,
    projectId: string | null,
    options?: { limit?: number; threshold?: number }
  ): Promise<SearchResult[]> {
    // Get all contexts with embeddings
    const contexts = await this.storage.listContextsWithEmbeddings(projectId ?? undefined);

    // Find related contexts
    return this.chainService.findRelated(
      embedding,
      contexts,
      {
        limit: options?.limit ?? 5,
        threshold: options?.threshold ?? 0.5,
      }
    );
  }
}
