import type { ContextRepository } from "../repositories/context.repository.js";
import type { Context, ContextWithSimilarity, ListOptions } from "../types/context.types.js";
import { EmbeddingClient } from "../ai/clients/embedding.client.js";

export interface SearchResult {
  contexts: Context[] | ContextWithSimilarity[];
  total: number;
}

export class SearchContextUseCase {
  constructor(
    private repository: ContextRepository,
    private embedding: EmbeddingClient
  ) {}

  async searchByKeyword(keyword: string, options?: ListOptions): Promise<SearchResult> {
    const all = await this.repository.findAll(options);
    const filtered = all.filter(
      (ctx) =>
        ctx.content.toLowerCase().includes(keyword.toLowerCase()) ||
        ctx.summary.toLowerCase().includes(keyword.toLowerCase()) ||
        ctx.tags.some((tag) => tag.toLowerCase().includes(keyword.toLowerCase()))
    );
    return { contexts: filtered, total: filtered.length };
  }

  async searchByTags(tags: string[]): Promise<SearchResult> {
    const contexts = await this.repository.findByTags(tags);
    return { contexts, total: contexts.length };
  }

  async searchSimilar(id: string, limit = 10): Promise<SearchResult> {
    const context = await this.repository.findById(id);
    if (!context) {
      throw new Error("Context not found: " + id);
    }
    if (!context.embedding || context.embedding.length === 0) {
      throw new Error("Context has no embedding: " + id);
    }
    const similar = await this.repository.findSimilar(context.embedding, limit + 1);
    const filtered = similar.filter((ctx) => ctx.id !== id).slice(0, limit);
    return { contexts: filtered, total: filtered.length };
  }

  async searchByText(text: string, limit = 10): Promise<SearchResult> {
    const embeddingVector = await this.embedding.embed(text);
    const similar = await this.repository.findSimilar(embeddingVector, limit);
    return { contexts: similar, total: similar.length };
  }
}
