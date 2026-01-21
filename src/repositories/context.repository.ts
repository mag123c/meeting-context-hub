import type { Context, ListOptions, ContextWithSimilarity } from "../types/context.types.js";

/**
 * Context Repository Interface
 * Implementation provided by Infrastructure Layer
 */
export interface ContextRepository {
  /**
   * Save a context and return its ID
   */
  save(context: Context): Promise<string>;

  /**
   * Find a context by ID
   */
  findById(id: string): Promise<Context | null>;

  /**
   * Find contexts by tags
   */
  findByTags(tags: string[]): Promise<Context[]>;

  /**
   * Find similar contexts by embedding similarity
   */
  findSimilar(embedding: number[], limit?: number): Promise<ContextWithSimilarity[]>;

  /**
   * Find all contexts
   */
  findAll(options?: ListOptions): Promise<Context[]>;

  /**
   * Delete a context
   */
  delete(id: string): Promise<void>;

  /**
   * Update context tags
   */
  updateTags(id: string, tags: string[]): Promise<void>;

  /**
   * Update context embedding
   */
  updateEmbedding(id: string, embedding: number[]): Promise<void>;

  /**
   * Get filename by ID (for Obsidian links)
   */
  getFileNameById(id: string): Promise<string | null>;

  /**
   * Append related document links
   */
  appendRelatedLinks(id: string, relatedIds: string[]): Promise<void>;
}
