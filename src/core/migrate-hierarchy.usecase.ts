import { readFile, writeFile, readdir, unlink, stat } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import type { ILLMClient } from "../ai/interfaces/index.js";
import { markdownToContext, contextToMarkdown } from "../storage/obsidian/frontmatter.js";
import { HierarchyService } from "./hierarchy.service.js";
import type { Context } from "../types/context.types.js";

const UNCATEGORIZED_PROJECT = "Uncategorized";
const GENERAL_CATEGORY = "General";
const HIERARCHY_CACHE_FILE = "hierarchy.json";

export interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  errors: string[];
}

export interface MigrationOptions {
  dryRun: boolean;
  toUncategorized: boolean;
}

export class MigrateHierarchyUseCase {
  private hierarchyService: HierarchyService;

  constructor(
    private readonly basePath: string,
    llm: ILLMClient
  ) {
    this.hierarchyService = new HierarchyService(basePath, llm);
  }

  /**
   * Migrate legacy files (root-level .md files) to hierarchy structure
   */
  async execute(options: MigrationOptions): Promise<MigrationResult> {
    const result: MigrationResult = {
      total: 0,
      migrated: 0,
      skipped: 0,
      errors: [],
    };

    // Get all .md files in root directory (not in subdirectories)
    const rootFiles = await this.getRootLevelMarkdownFiles();
    result.total = rootFiles.length;

    if (rootFiles.length === 0) {
      return result;
    }

    for (const file of rootFiles) {
      try {
        const filePath = join(this.basePath, file);
        const markdown = await readFile(filePath, "utf-8");
        const context = markdownToContext(markdown);

        // Skip if already has project/category
        if (context.project && context.category) {
          result.skipped++;
          continue;
        }

        let targetProject: string;
        let targetCategory: string;

        if (options.toUncategorized) {
          // Move all to Uncategorized/General
          targetProject = UNCATEGORIZED_PROJECT;
          targetCategory = GENERAL_CATEGORY;
        } else {
          // Use AI to classify
          const placement = await this.hierarchyService.classify(
            context.summary || context.content.slice(0, 500),
            context.tags,
            context.type
          );
          targetProject = placement.project;
          targetCategory = placement.category;
        }

        // Update context with new project/category
        const updatedContext: Context = {
          ...context,
          project: targetProject,
          category: targetCategory,
          updatedAt: new Date(),
        };

        if (options.dryRun) {
          console.log(`[DRY-RUN] Would migrate: ${file} → ${targetProject}/${targetCategory}/`);
          result.migrated++;
          continue;
        }

        // Ensure target folder exists
        await this.hierarchyService.ensureFolderPath(targetProject, targetCategory);

        // Write updated context to new location
        const targetDir = join(this.basePath, targetProject, targetCategory);
        const newFilePath = join(targetDir, file);
        const updatedMarkdown = contextToMarkdown(updatedContext);

        // Write to new location
        await writeFile(newFilePath, updatedMarkdown, "utf-8");

        // Remove original file
        await unlink(filePath);

        result.migrated++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`${file}: ${errorMsg}`);
      }
    }

    return result;
  }

  /**
   * Get all .md files in root directory (not in subdirectories)
   */
  private async getRootLevelMarkdownFiles(): Promise<string[]> {
    if (!existsSync(this.basePath)) {
      return [];
    }

    const entries = await readdir(this.basePath);
    const rootMdFiles: string[] = [];

    for (const entry of entries) {
      // Skip hierarchy cache file
      if (entry === HIERARCHY_CACHE_FILE) continue;

      const entryPath = join(this.basePath, entry);
      const entryStat = await stat(entryPath);

      // Only include .md files, not directories
      if (!entryStat.isDirectory() && entry.endsWith(".md")) {
        rootMdFiles.push(entry);
      }
    }

    return rootMdFiles;
  }

  /**
   * Get migration preview (count of files to be migrated)
   */
  async getPreview(): Promise<{ count: number; files: string[] }> {
    const files = await this.getRootLevelMarkdownFiles();
    return { count: files.length, files };
  }
}
