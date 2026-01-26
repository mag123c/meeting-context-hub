import type { EmbeddingProvider } from '../../adapters/ai/openai.adapter.js';
import type { Context, ExtractedContext } from '../../types/index.js';

/**
 * Service for generating and managing embeddings
 */
export class EmbeddingService {
  constructor(private readonly embeddingProvider: EmbeddingProvider | null) {}

  /**
   * Check if embedding is available
   */
  isAvailable(): boolean {
    return this.embeddingProvider !== null;
  }

  /**
   * Generate embedding for context
   * Creates a combined text from title, summary, decisions, policies, and tags
   */
  async generateForContext(context: Context | ExtractedContext & { rawInput?: string }): Promise<Float32Array | null> {
    if (!this.embeddingProvider) {
      return null;
    }

    const text = this.buildEmbeddingText(context);
    return this.embeddingProvider.embed(text);
  }

  /**
   * Generate embedding for search query
   */
  async generateForQuery(query: string): Promise<Float32Array | null> {
    if (!this.embeddingProvider) {
      return null;
    }

    return this.embeddingProvider.embed(query);
  }

  /**
   * Build combined text for embedding
   */
  private buildEmbeddingText(context: Context | ExtractedContext & { rawInput?: string }): string {
    const parts: string[] = [];

    // Title and summary are most important
    parts.push(context.title);
    parts.push(context.summary);

    // Decisions and policies provide context
    if (context.decisions.length > 0) {
      parts.push('Decisions: ' + context.decisions.join('. '));
    }

    if (context.policies.length > 0) {
      parts.push('Policies: ' + context.policies.join('. '));
    }

    // Tags for categorization
    if (context.tags.length > 0) {
      parts.push('Tags: ' + context.tags.join(', '));
    }

    return parts.filter(Boolean).join('\n\n');
  }
}
