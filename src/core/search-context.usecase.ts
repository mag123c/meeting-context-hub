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

  async searchByTags(tags: string[], options?: ListOptions): Promise<SearchResult> {
    let contexts = await this.repository.findByTags(tags);
    // Apply project/sprint filters
    if (options?.project) {
      contexts = contexts.filter((ctx) => ctx.project === options.project);
    }
    if (options?.sprint) {
      contexts = contexts.filter((ctx) => ctx.sprint === options.sprint);
    }
    return { contexts, total: contexts.length };
  }

  async searchSimilar(id: string, limit = 10, options?: ListOptions): Promise<SearchResult> {
    const context = await this.repository.findById(id);
    if (!context) {
      throw new Error("Context not found: " + id);
    }
    if (!context.embedding || context.embedding.length === 0) {
      throw new Error("Context has no embedding: " + id);
    }
    const similar = await this.repository.findSimilar(context.embedding, limit + 1);
    let filtered = similar.filter((ctx) => ctx.id !== id);
    // Apply project/sprint filters
    if (options?.project) {
      filtered = filtered.filter((ctx) => ctx.project === options.project);
    }
    if (options?.sprint) {
      filtered = filtered.filter((ctx) => ctx.sprint === options.sprint);
    }
    filtered = filtered.slice(0, limit);
    return { contexts: filtered, total: filtered.length };
  }

  async searchByText(text: string, limit = 10, options?: ListOptions): Promise<SearchResult> {
    const embeddingVector = await this.embedding.embed(text);
    // Fetch more if filtering, to ensure we get enough results
    const fetchLimit = options?.project || options?.sprint ? limit * 3 : limit;
    let similar = await this.repository.findSimilar(embeddingVector, fetchLimit);
    // Apply project/sprint filters
    if (options?.project) {
      similar = similar.filter((ctx) => ctx.project === options.project);
    }
    if (options?.sprint) {
      similar = similar.filter((ctx) => ctx.sprint === options.sprint);
    }
    similar = similar.slice(0, limit);
    return { contexts: similar, total: similar.length };
  }
}
