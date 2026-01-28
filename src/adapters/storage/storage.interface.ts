import type { Context, Project, ListOptions, DictionaryEntry, PromptContext } from '../../types/index.js';

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

  // Dictionary operations
  saveDictionaryEntry(entry: DictionaryEntry): Promise<void>;
  getDictionaryEntry(id: string): Promise<DictionaryEntry | null>;
  getDictionaryEntryBySource(source: string): Promise<DictionaryEntry | null>;
  listDictionaryEntries(): Promise<DictionaryEntry[]>;
  updateDictionaryEntry(id: string, updates: Partial<DictionaryEntry>): Promise<void>;
  deleteDictionaryEntry(id: string): Promise<void>;
  getAllDictionaryMappings(): Promise<Map<string, string>>;

  // PromptContext operations
  savePromptContext(context: PromptContext): Promise<void>;
  getPromptContext(id: string): Promise<PromptContext | null>;
  listPromptContexts(): Promise<PromptContext[]>;
  listEnabledPromptContexts(): Promise<PromptContext[]>;
  updatePromptContext(id: string, updates: Partial<PromptContext>): Promise<void>;
  deletePromptContext(id: string): Promise<void>;
}
