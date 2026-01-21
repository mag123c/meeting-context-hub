import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import type { ILLMClient } from "../ai/interfaces/index.js";
import type { HierarchyCache, HierarchyPlacement, HierarchyProject } from "../types/hierarchy.types.js";
import { hierarchyClassificationPrompt, buildHierarchyContext } from "../ai/prompts/hierarchy-classification.prompt.js";
import { extractJsonFromMarkdown, safeJsonParse } from "../utils/index.js";

const HIERARCHY_CACHE_FILE = "hierarchy.json";
const DEFAULT_PROJECT = "Uncategorized";
const DEFAULT_CATEGORY = "General";

export class HierarchyService {
  private cache: HierarchyCache | null = null;

  constructor(
    private readonly basePath: string,
    private readonly llm: ILLMClient
  ) {}

  /**
   * Get the path to hierarchy.json cache file
   */
  private getCachePath(): string {
    return join(this.basePath, HIERARCHY_CACHE_FILE);
  }

  /**
   * Load hierarchy cache from disk
   */
  async loadCache(): Promise<HierarchyCache> {
    if (this.cache) {
      return this.cache;
    }

    const cachePath = this.getCachePath();
    if (!existsSync(cachePath)) {
      this.cache = this.createEmptyCache();
      return this.cache;
    }

    try {
      const content = await readFile(cachePath, "utf-8");
      this.cache = JSON.parse(content) as HierarchyCache;
      return this.cache;
    } catch {
      this.cache = this.createEmptyCache();
      return this.cache;
    }
  }

  /**
   * Save hierarchy cache to disk
   */
  async saveCache(): Promise<void> {
    if (!this.cache) return;

    const cachePath = this.getCachePath();
    const cacheDir = dirname(cachePath);

    if (!existsSync(cacheDir)) {
      await mkdir(cacheDir, { recursive: true });
    }

    this.cache.updatedAt = new Date().toISOString();
    await writeFile(cachePath, JSON.stringify(this.cache, null, 2), "utf-8");
  }

  /**
   * Create empty hierarchy cache
   */
  private createEmptyCache(): HierarchyCache {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      projects: [],
    };
  }

  /**
   * Classify content using AI and return placement
   */
  async classify(
    content: string,
    tags: string[],
    contextType: string
  ): Promise<HierarchyPlacement> {
    const cache = await this.loadCache();
    const hierarchyContext = buildHierarchyContext(cache);

    // Build input string for the prompt template
    const inputData = {
      content,
      hierarchyContext,
      tags,
      contextType,
    };

    const response = await this.llm.complete(
      hierarchyClassificationPrompt,
      JSON.stringify(inputData)
    );

    try {
      const cleanedJSON = extractJsonFromMarkdown(response);
      const parsed = safeJsonParse(cleanedJSON, {
        project: DEFAULT_PROJECT,
        category: DEFAULT_CATEGORY,
        isNewProject: true,
        isNewCategory: true,
        confidence: 0.5,
      });

      const placement: HierarchyPlacement = {
        project: parsed.project || DEFAULT_PROJECT,
        category: parsed.category || DEFAULT_CATEGORY,
        isNewProject: Boolean(parsed.isNewProject),
        isNewCategory: Boolean(parsed.isNewCategory),
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      };

      // Update cache with new project/category
      await this.updateCacheWithPlacement(placement);

      return placement;
    } catch {
      // Fallback to default placement
      return {
        project: DEFAULT_PROJECT,
        category: DEFAULT_CATEGORY,
        isNewProject: false,
        isNewCategory: false,
        confidence: 0,
      };
    }
  }

  /**
   * Update cache with new placement
   */
  private async updateCacheWithPlacement(placement: HierarchyPlacement): Promise<void> {
    const cache = await this.loadCache();

    let project = cache.projects.find((p) => p.name === placement.project);

    if (!project) {
      project = { name: placement.project, categories: [] };
      cache.projects.push(project);
    }

    if (!project.categories.includes(placement.category)) {
      project.categories.push(placement.category);
    }

    await this.saveCache();
  }

  /**
   * Ensure folder structure exists for a placement
   */
  async ensureFolderPath(project: string, category: string): Promise<string> {
    const folderPath = join(this.basePath, project, category);

    if (!existsSync(folderPath)) {
      await mkdir(folderPath, { recursive: true });
    }

    return folderPath;
  }

  /**
   * Get the file path for a context based on hierarchy placement
   */
  getContextPath(
    project: string | undefined,
    category: string | undefined,
    fileName: string
  ): string {
    if (project && category) {
      return join(this.basePath, project, category, fileName);
    }
    if (project) {
      return join(this.basePath, project, DEFAULT_CATEGORY, fileName);
    }
    // Legacy: no hierarchy, save directly in basePath
    return join(this.basePath, fileName);
  }

  /**
   * Get all projects from cache
   */
  async getProjects(): Promise<HierarchyProject[]> {
    const cache = await this.loadCache();
    return cache.projects;
  }

  /**
   * Get categories for a specific project
   */
  async getCategories(projectName: string): Promise<string[]> {
    const cache = await this.loadCache();
    const project = cache.projects.find((p) => p.name === projectName);
    return project?.categories || [];
  }

  /**
   * Invalidate cache (force reload on next access)
   */
  invalidateCache(): void {
    this.cache = null;
  }

  /**
   * Add a project to cache manually
   */
  async addProject(name: string, categories: string[] = []): Promise<void> {
    const cache = await this.loadCache();

    const existing = cache.projects.find((p) => p.name === name);
    if (existing) {
      // Merge categories
      for (const cat of categories) {
        if (!existing.categories.includes(cat)) {
          existing.categories.push(cat);
        }
      }
    } else {
      cache.projects.push({ name, categories });
    }

    await this.saveCache();
  }

  /**
   * Check if a project exists
   */
  async projectExists(name: string): Promise<boolean> {
    const cache = await this.loadCache();
    return cache.projects.some((p) => p.name === name);
  }

  /**
   * Check if a category exists within a project
   */
  async categoryExists(projectName: string, categoryName: string): Promise<boolean> {
    const cache = await this.loadCache();
    const project = cache.projects.find((p) => p.name === projectName);
    return project?.categories.includes(categoryName) ?? false;
  }
}
