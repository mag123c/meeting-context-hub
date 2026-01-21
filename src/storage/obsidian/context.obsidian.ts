import { readFile, writeFile, readdir, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import type { ContextRepository } from "../../repositories/context.repository.js";
import type { Context, ListOptions, ContextWithSimilarity } from "../../types/context.types.js";
import { contextToMarkdown, markdownToContext, updateFrontmatter } from "./frontmatter.js";
import { applyFilters, cosineSimilarity, normalizeKoreanText } from "../../utils/index.js";
import { NotFoundError } from "../../errors/index.js";
import { STORAGE_CONFIG } from "../../config/constants.js";

export class ObsidianContextRepository implements ContextRepository {
  private cache: { contexts: Context[]; timestamp: number } | null = null;
  private static readonly CACHE_TTL_MS = 5000;

  constructor(private readonly basePath: string) {}

  private async ensureDir(): Promise<void> {
    if (!existsSync(this.basePath)) {
      await mkdir(this.basePath, { recursive: true });
    }
  }

  /**
   * Invalidate cache (call after write operations)
   */
  private invalidateCache(): void {
    this.cache = null;
  }

  /**
   * Load all contexts from disk (uncached)
   */
  private async loadAllFromDisk(): Promise<Context[]> {
    await this.ensureDir();
    const files = await readdir(this.basePath);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    const contexts: Context[] = [];
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
    return contexts;
  }

  /**
   * Get all contexts with caching
   */
  private async getAllCached(): Promise<Context[]> {
    const now = Date.now();
    if (this.cache && now - this.cache.timestamp < ObsidianContextRepository.CACHE_TTL_MS) {
      return this.cache.contexts;
    }
    const contexts = await this.loadAllFromDisk();
    this.cache = { contexts, timestamp: now };
    return contexts;
  }

  /**
   * Generate filename: {short-title}_{short-id}.md
   * Example: PG-integration-done_a64cbac7.md
   */
  private generateFileName(context: Context): string {
    const shortId = context.id.slice(0, STORAGE_CONFIG.SHORT_ID_LENGTH);
    const title = this.extractShortTitle(context.summary);
    return `${title}_${shortId}.md`;
  }

  /**
   * Extract short title from summary
   */
  private extractShortTitle(summary: string): string {
    return normalizeKoreanText(summary);
  }

  private getFilePath(id: string, summary?: string): string {
    if (summary) {
      const shortId = id.slice(0, STORAGE_CONFIG.SHORT_ID_LENGTH);
      const title = this.extractShortTitle(summary);
      return join(this.basePath, `${title}_${shortId}.md`);
    }
    // fallback: UUID filename (legacy compatibility)
    return join(this.basePath, `${id}.md`);
  }

  async save(context: Context): Promise<string> {
    await this.ensureDir();
    const fileName = this.generateFileName(context);
    const filePath = join(this.basePath, fileName);
    const markdown = contextToMarkdown(context);
    await writeFile(filePath, markdown, "utf-8");
    this.invalidateCache();
    return context.id;
  }

  async findById(id: string): Promise<Context | null> {
    // 1. First scan all files and find by frontmatter id
    const context = await this.findByIdFromAll(id);
    if (context) return context;

    // 2. fallback: legacy UUID filename
    const legacyPath = join(this.basePath, `${id}.md`);
    if (existsSync(legacyPath)) {
      const markdown = await readFile(legacyPath, "utf-8");
      return markdownToContext(markdown);
    }

    return null;
  }

  private async findByIdFromAll(id: string): Promise<Context | null> {
    await this.ensureDir();
    const files = await readdir(this.basePath);
    const shortId = id.slice(0, STORAGE_CONFIG.SHORT_ID_LENGTH);

    // Find file containing short ID first (fast path)
    const matchingFile = files.find(f => f.includes(shortId) && f.endsWith(".md"));
    if (matchingFile) {
      const filePath = join(this.basePath, matchingFile);
      const markdown = await readFile(filePath, "utf-8");
      const ctx = markdownToContext(markdown);
      if (ctx.id === id) return ctx;
    }

    // Full scan (fallback)
    for (const file of files.filter(f => f.endsWith(".md"))) {
      const filePath = join(this.basePath, file);
      const markdown = await readFile(filePath, "utf-8");
      try {
        const ctx = markdownToContext(markdown);
        if (ctx.id === id) return ctx;
      } catch {
        // Skip invalid files
      }
    }

    return null;
  }

  async findByTags(tags: string[]): Promise<Context[]> {
    const all = await this.getAllCached();
    return all.filter((ctx) =>
      tags.some((tag) => ctx.tags.includes(tag))
    );
  }

  async findSimilar(embedding: number[], limit = 10): Promise<ContextWithSimilarity[]> {
    const all = await this.getAllCached();
    const withSimilarity: ContextWithSimilarity[] = all
      .filter((ctx) => ctx.embedding && ctx.embedding.length > 0)
      .map((ctx) => ({
        ...ctx,
        similarity: cosineSimilarity(embedding, ctx.embedding!),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    return withSimilarity;
  }

  async findAll(options?: ListOptions): Promise<Context[]> {
    let contexts = await this.getAllCached();

    // Apply filters using utility
    contexts = applyFilters(contexts, options);

    // Sort by createdAt descending
    contexts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? contexts.length;
    return contexts.slice(offset, offset + limit);
  }

  async delete(id: string): Promise<void> {
    // Find file by ID
    const context = await this.findById(id);
    if (!context) return;

    // New filename format
    const newPath = this.getFilePath(id, context.summary);
    if (existsSync(newPath)) {
      await unlink(newPath);
      this.invalidateCache();
      return;
    }

    // Legacy UUID filename
    const legacyPath = join(this.basePath, `${id}.md`);
    if (existsSync(legacyPath)) {
      await unlink(legacyPath);
      this.invalidateCache();
    }
  }

  async updateTags(id: string, tags: string[]): Promise<void> {
    const context = await this.findById(id);
    if (!context) {
      throw new NotFoundError("Context", id);
    }

    const filePath = await this.findFilePathById(id);
    if (!filePath) {
      throw new NotFoundError("Context file", id);
    }

    const markdown = await readFile(filePath, "utf-8");
    const updated = updateFrontmatter(markdown, { tags });
    await writeFile(filePath, updated, "utf-8");
    this.invalidateCache();
  }

  async updateEmbedding(id: string, embedding: number[]): Promise<void> {
    const filePath = await this.findFilePathById(id);
    if (!filePath) {
      throw new NotFoundError("Context", id);
    }
    const markdown = await readFile(filePath, "utf-8");
    const updated = updateFrontmatter(markdown, { embedding });
    await writeFile(filePath, updated, "utf-8");
    this.invalidateCache();
  }

  private async findFilePathById(id: string): Promise<string | null> {
    await this.ensureDir();
    const files = await readdir(this.basePath);
    const shortId = id.slice(0, STORAGE_CONFIG.SHORT_ID_LENGTH);

    // Fast search by short ID
    const matchingFile = files.find(f => f.includes(shortId) && f.endsWith(".md"));
    if (matchingFile) {
      return join(this.basePath, matchingFile);
    }

    // Legacy UUID filename
    const legacyPath = join(this.basePath, `${id}.md`);
    if (existsSync(legacyPath)) {
      return legacyPath;
    }

    return null;
  }

  /**
   * Get filename by ID (without extension, for Obsidian links)
   */
  async getFileNameById(id: string): Promise<string | null> {
    const filePath = await this.findFilePathById(id);
    if (!filePath) return null;
    const fileName = filePath.split("/").pop();
    return fileName ? fileName.replace(/\.md$/, "") : null;
  }

  /**
   * Append related documents section
   */
  async appendRelatedLinks(id: string, relatedIds: string[]): Promise<void> {
    const filePath = await this.findFilePathById(id);
    if (!filePath) return;

    // Get related document filenames (parallel)
    const fileNames = await Promise.all(
      relatedIds.map(relatedId => this.getFileNameById(relatedId))
    );

    const links = fileNames
      .filter((fileName): fileName is string => fileName !== null)
      .map(fileName => `- [[${fileName}]]`);

    if (links.length === 0) return;

    // Append related documents section to file
    let content = await readFile(filePath, "utf-8");

    // Remove existing related documents section (if any)
    content = content.replace(/\n## 관련 문서\n[\s\S]*$/, "");

    // Add new section
    const relatedSection = `\n## 관련 문서\n${links.join("\n")}\n`;
    content = content.trimEnd() + "\n" + relatedSection;

    await writeFile(filePath, content, "utf-8");
    this.invalidateCache();
  }
}
