import { readFile, writeFile, readdir, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import type { ContextRepository } from "../../repositories/context.repository.js";
import type { Context, ListOptions, ContextWithSimilarity } from "../../types/context.types.js";
import { contextToMarkdown, markdownToContext, updateFrontmatter } from "./frontmatter.js";

export class ObsidianContextRepository implements ContextRepository {
  constructor(private readonly basePath: string) {}

  private async ensureDir(): Promise<void> {
    if (!existsSync(this.basePath)) {
      await mkdir(this.basePath, { recursive: true });
    }
  }

  private getFilePath(id: string): string {
    return join(this.basePath, `${id}.md`);
  }

  async save(context: Context): Promise<string> {
    await this.ensureDir();
    const filePath = this.getFilePath(context.id);
    const markdown = contextToMarkdown(context);
    await writeFile(filePath, markdown, "utf-8");
    return context.id;
  }

  async findById(id: string): Promise<Context | null> {
    const filePath = this.getFilePath(id);
    if (!existsSync(filePath)) {
      return null;
    }
    const markdown = await readFile(filePath, "utf-8");
    return markdownToContext(markdown);
  }

  async findByTags(tags: string[]): Promise<Context[]> {
    const all = await this.findAll();
    return all.filter((ctx) =>
      tags.some((tag) => ctx.tags.includes(tag))
    );
  }

  async findSimilar(embedding: number[], limit = 10): Promise<ContextWithSimilarity[]> {
    const all = await this.findAll();
    const withSimilarity: ContextWithSimilarity[] = all
      .filter((ctx) => ctx.embedding && ctx.embedding.length > 0)
      .map((ctx) => ({
        ...ctx,
        similarity: this.cosineSimilarity(embedding, ctx.embedding!),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    return withSimilarity;
  }

  async findAll(options?: ListOptions): Promise<Context[]> {
    await this.ensureDir();
    const files = await readdir(this.basePath);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    let contexts: Context[] = [];
    for (const file of mdFiles) {
      const filePath = join(this.basePath, file);
      const markdown = await readFile(filePath, "utf-8");
      try {
        const ctx = markdownToContext(markdown);
        contexts.push(ctx);
      } catch {
        // Skip invalid files
      }
    }

    // Apply filters
    if (options?.tags && options.tags.length > 0) {
      contexts = contexts.filter((ctx) =>
        options.tags!.some((tag) => ctx.tags.includes(tag))
      );
    }
    if (options?.type) {
      contexts = contexts.filter((ctx) => ctx.type === options.type);
    }

    // Sort by createdAt descending
    contexts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? contexts.length;
    return contexts.slice(offset, offset + limit);
  }

  async delete(id: string): Promise<void> {
    const filePath = this.getFilePath(id);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  }

  async updateTags(id: string, tags: string[]): Promise<void> {
    const filePath = this.getFilePath(id);
    if (!existsSync(filePath)) {
      throw new Error(`Context not found: ${id}`);
    }
    const markdown = await readFile(filePath, "utf-8");
    const updated = updateFrontmatter(markdown, { tags });
    await writeFile(filePath, updated, "utf-8");
  }

  async updateEmbedding(id: string, embedding: number[]): Promise<void> {
    const filePath = this.getFilePath(id);
    if (!existsSync(filePath)) {
      throw new Error(`Context not found: ${id}`);
    }
    const markdown = await readFile(filePath, "utf-8");
    const updated = updateFrontmatter(markdown, { embedding });
    await writeFile(filePath, updated, "utf-8");
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
