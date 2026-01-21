import { readFile, writeFile, readdir, unlink, mkdir, stat } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import type { ContextRepository } from "../../repositories/context.repository.js";
import type { Context, ListOptions, ContextWithSimilarity } from "../../types/context.types.js";
import { contextToMarkdown, markdownToContext, updateFrontmatter } from "./frontmatter.js";
import { applyFilters, cosineSimilarity, normalizeKoreanText } from "../../utils/index.js";
import { NotFoundError } from "../../errors/index.js";
import { STORAGE_CONFIG } from "../../config/constants.js";

const HIERARCHY_CACHE_FILE = "hierarchy.json";

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
   * Load all contexts from disk recursively (uncached)
   */
  private async loadAllFromDisk(): Promise<Context[]> {
    await this.ensureDir();
    return this.loadContextsRecursively(this.basePath);
  }

  /**
   * Recursively load markdown files from directory and subdirectories
   */
  private async loadContextsRecursively(dirPath: string): Promise<Context[]> {
    const contexts: Context[] = [];
    const entries = await readdir(dirPath);

    for (const entry of entries) {
      const entryPath = join(dirPath, entry);

      // Skip hierarchy.json
      if (entry === HIERARCHY_CACHE_FILE) continue;

      try {
        const entryStat = await stat(entryPath);

        if (entryStat.isDirectory()) {
          // Recursively load from subdirectory
          const subContexts = await this.loadContextsRecursively(entryPath);
          contexts.push(...subContexts);
        } else if (entry.endsWith(".md")) {
          const markdown = await readFile(entryPath, "utf-8");
          try {
            const ctx = markdownToContext(markdown);
            contexts.push(ctx);
          } catch {
            // Skip invalid files
          }
        }
      } catch {
        // Skip entries we can't access
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
    const fileName = this.generateFileName(context);
    const folderPath = this.getHierarchyPath(context.project, context.category);

    // Ensure the target directory exists
    if (!existsSync(folderPath)) {
      await mkdir(folderPath, { recursive: true });
    }

    const filePath = join(folderPath, fileName);
    const markdown = contextToMarkdown(context);
    await writeFile(filePath, markdown, "utf-8");
    this.invalidateCache();
    return context.id;
  }

  /**
   * Get the folder path based on hierarchy (project/category)
   */
  private getHierarchyPath(project?: string, category?: string): string {
    if (project && category) {
      return join(this.basePath, project, category);
    }
    if (project) {
      return join(this.basePath, project, "General");
    }
    // Legacy: save directly in basePath
    return this.basePath;
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
    const shortId = id.slice(0, STORAGE_CONFIG.SHORT_ID_LENGTH);
    return this.findByIdRecursively(this.basePath, id, shortId);
  }

  /**
   * Recursively search for a context by ID
   */
  private async findByIdRecursively(
    dirPath: string,
    id: string,
    shortId: string
  ): Promise<Context | null> {
    const entries = await readdir(dirPath);

    // First, try to find file containing short ID (fast path)
    const matchingFile = entries.find(f => f.includes(shortId) && f.endsWith(".md"));
    if (matchingFile) {
      const filePath = join(dirPath, matchingFile);
      try {
        const markdown = await readFile(filePath, "utf-8");
        const ctx = markdownToContext(markdown);
        if (ctx.id === id) return ctx;
      } catch {
        // Continue searching
      }
    }

    // Search in subdirectories
    for (const entry of entries) {
      if (entry === HIERARCHY_CACHE_FILE) continue;

      const entryPath = join(dirPath, entry);
      try {
        const entryStat = await stat(entryPath);
        if (entryStat.isDirectory()) {
          const result = await this.findByIdRecursively(entryPath, id, shortId);
          if (result) return result;
        } else if (entry.endsWith(".md") && !entry.includes(shortId)) {
          // Check non-matching files as fallback
          const markdown = await readFile(entryPath, "utf-8");
          try {
            const ctx = markdownToContext(markdown);
            if (ctx.id === id) return ctx;
          } catch {
            // Skip invalid files
          }
        }
      } catch {
        // Skip entries we can't access
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
    const shortId = id.slice(0, STORAGE_CONFIG.SHORT_ID_LENGTH);
    return this.findFilePathRecursively(this.basePath, id, shortId);
  }

  /**
   * Recursively find file path by ID
   */
  private async findFilePathRecursively(
    dirPath: string,
    id: string,
    shortId: string
  ): Promise<string | null> {
    const entries = await readdir(dirPath);

    // Fast search by short ID first
    const matchingFile = entries.find(f => f.includes(shortId) && f.endsWith(".md"));
    if (matchingFile) {
      const filePath = join(dirPath, matchingFile);
      try {
        const markdown = await readFile(filePath, "utf-8");
        const ctx = markdownToContext(markdown);
        if (ctx.id === id) return filePath;
      } catch {
        // Continue searching
      }
    }

    // Legacy UUID filename check
    const legacyPath = join(dirPath, `${id}.md`);
    if (existsSync(legacyPath)) {
      return legacyPath;
    }

    // Search in subdirectories
    for (const entry of entries) {
      if (entry === HIERARCHY_CACHE_FILE) continue;

      const entryPath = join(dirPath, entry);
      try {
        const entryStat = await stat(entryPath);
        if (entryStat.isDirectory()) {
          const result = await this.findFilePathRecursively(entryPath, id, shortId);
          if (result) return result;
        }
      } catch {
        // Skip entries we can't access
      }
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
