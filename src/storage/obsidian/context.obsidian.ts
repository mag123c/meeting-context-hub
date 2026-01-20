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

  /**
   * 파일명 생성: {sanitized-summary}_{short-id}.md
   */
  private generateFileName(context: Context): string {
    const shortId = context.id.slice(0, 8);
    const sanitized = this.sanitizeForFileName(context.summary);
    return `${sanitized}_${shortId}.md`;
  }

  /**
   * 파일명용 문자열 정제
   * - 특수문자 제거
   * - 공백 → 하이픈
   * - 20자 제한
   */
  private sanitizeForFileName(text: string): string {
    return text
      .replace(/[<>:"/\\|?*]/g, "") // 파일명 금지 문자 제거
      .replace(/\s+/g, "-") // 공백 → 하이픈
      .replace(/-+/g, "-") // 연속 하이픈 정리
      .slice(0, 30) // 30자 제한
      .replace(/-$/, ""); // 끝 하이픈 제거
  }

  private getFilePath(id: string, summary?: string): string {
    if (summary) {
      const shortId = id.slice(0, 8);
      const sanitized = this.sanitizeForFileName(summary);
      return join(this.basePath, `${sanitized}_${shortId}.md`);
    }
    // fallback: UUID 파일명 (구버전 호환)
    return join(this.basePath, `${id}.md`);
  }

  async save(context: Context): Promise<string> {
    await this.ensureDir();
    const fileName = this.generateFileName(context);
    const filePath = join(this.basePath, fileName);
    const markdown = contextToMarkdown(context);
    await writeFile(filePath, markdown, "utf-8");
    return context.id;
  }

  async findById(id: string): Promise<Context | null> {
    // 1. 먼저 전체 파일 스캔해서 frontmatter id로 찾기
    const context = await this.findByIdFromAll(id);
    if (context) return context;

    // 2. fallback: 구버전 UUID 파일명
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
    const shortId = id.slice(0, 8);
    
    // short ID가 포함된 파일 먼저 찾기 (빠른 경로)
    const matchingFile = files.find(f => f.includes(shortId) && f.endsWith(".md"));
    if (matchingFile) {
      const filePath = join(this.basePath, matchingFile);
      const markdown = await readFile(filePath, "utf-8");
      const ctx = markdownToContext(markdown);
      if (ctx.id === id) return ctx;
    }

    // 전체 스캔 (fallback)
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
    // ID로 파일 찾기
    const context = await this.findById(id);
    if (!context) return;

    // 새 파일명 형식
    const newPath = this.getFilePath(id, context.summary);
    if (existsSync(newPath)) {
      await unlink(newPath);
      return;
    }

    // 구버전 UUID 파일명
    const legacyPath = join(this.basePath, `${id}.md`);
    if (existsSync(legacyPath)) {
      await unlink(legacyPath);
    }
  }

  async updateTags(id: string, tags: string[]): Promise<void> {
    const context = await this.findById(id);
    if (!context) {
      throw new Error(`Context not found: ${id}`);
    }

    const filePath = await this.findFilePathById(id);
    if (!filePath) {
      throw new Error(`File not found for context: ${id}`);
    }

    const markdown = await readFile(filePath, "utf-8");
    const updated = updateFrontmatter(markdown, { tags });
    await writeFile(filePath, updated, "utf-8");
  }

  async updateEmbedding(id: string, embedding: number[]): Promise<void> {
    const filePath = await this.findFilePathById(id);
    if (!filePath) {
      throw new Error(`Context not found: ${id}`);
    }
    const markdown = await readFile(filePath, "utf-8");
    const updated = updateFrontmatter(markdown, { embedding });
    await writeFile(filePath, updated, "utf-8");
  }

  private async findFilePathById(id: string): Promise<string | null> {
    await this.ensureDir();
    const files = await readdir(this.basePath);
    const shortId = id.slice(0, 8);

    // short ID로 빠른 검색
    const matchingFile = files.find(f => f.includes(shortId) && f.endsWith(".md"));
    if (matchingFile) {
      return join(this.basePath, matchingFile);
    }

    // 구버전 UUID 파일명
    const legacyPath = join(this.basePath, `${id}.md`);
    if (existsSync(legacyPath)) {
      return legacyPath;
    }

    return null;
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
