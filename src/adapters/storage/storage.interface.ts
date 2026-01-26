import type { Context, Project, ListOptions } from '../../types/index.js';

/**
 * Storage provider interface (Port)
 */
export interface StorageProvider {
  // Initialization
  initialize(): Promise<void>;
  close(): void;

  // Context operations
  saveContext(context: Context): Promise<void>;
  getContext(id: string): Promise<Context | null>;
  listContexts(options?: ListOptions): Promise<Context[]>;
  updateContext(id: string, updates: Partial<Context>): Promise<void>;
  deleteContext(id: string): Promise<void>;

  // Search operations
  listContextsWithEmbeddings(projectId?: string): Promise<Context[]>;
  searchByKeyword(keyword: string, options?: { projectId?: string; limit?: number }): Promise<Context[]>;

  // Project operations
  saveProject(project: Project): Promise<void>;
  getProject(id: string): Promise<Project | null>;
  getProjectByName(name: string): Promise<Project | null>;
  listProjects(): Promise<Project[]>;
  updateProject(id: string, updates: Partial<Project>): Promise<void>;
  deleteProject(id: string): Promise<void>;

  // Utility
  getContextCount(projectId?: string): Promise<number>;
}
