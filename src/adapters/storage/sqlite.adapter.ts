import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import type { StorageProvider } from './storage.interface.js';
import type {
  Context,
  Project,
  ListOptions,
  ActionItem,
  DictionaryEntry,
  PromptContext,
  PromptContextCategory,
} from '../../types/index.js';
import { StorageError, ErrorCode } from '../../types/errors.js';

/**
 * SQLite storage adapter
 */
export class SQLiteAdapter implements StorageProvider {
  private db: Database.Database | null = null;

  constructor(private readonly dbPath: string) {}

  async initialize(): Promise<void> {
    try {
      // Ensure directory exists
      const dir = dirname(this.dbPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Open database
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');

      // Create tables
      this.createTables();
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      throw new StorageError(
        `Failed to initialize database: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_CONNECTION_FAILED,
        false,
        originalError
      );
    }
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private getDb(): Database.Database {
    if (!this.db) {
      throw new StorageError(
        'Database not initialized. Call initialize() first.',
        ErrorCode.DB_NOT_INITIALIZED,
        false
      );
    }
    return this.db;
  }

  private createTables(): void {
    const db = this.getDb();

    // Projects table
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Contexts table
    db.exec(`
      CREATE TABLE IF NOT EXISTS contexts (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        raw_input TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT,
        decisions TEXT,
        action_items TEXT,
        policies TEXT,
        open_questions TEXT,
        tags TEXT,
        embedding BLOB,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Migration: Add project_id to contexts if it doesn't exist
    this.migrateContextsTable();

    // Indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_contexts_project ON contexts(project_id);
      CREATE INDEX IF NOT EXISTS idx_contexts_created ON contexts(created_at DESC);
    `);

    // Dictionary table
    db.exec(`
      CREATE TABLE IF NOT EXISTS dictionary (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        source TEXT NOT NULL,
        target TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(project_id, source)
      )
    `);

    // Migration: Add project_id to dictionary if it doesn't exist
    this.migrateDictionaryTable();

    // Dictionary indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_dictionary_source ON dictionary(source);
      CREATE INDEX IF NOT EXISTS idx_dictionary_project ON dictionary(project_id);
    `);

    // PromptContext table
    db.exec(`
      CREATE TABLE IF NOT EXISTS prompt_contexts (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        category TEXT NOT NULL DEFAULT 'custom',
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Migration: Add project_id to prompt_contexts if it doesn't exist
    this.migratePromptContextsTable();

    // PromptContext indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_prompt_contexts_enabled ON prompt_contexts(enabled);
      CREATE INDEX IF NOT EXISTS idx_prompt_contexts_category ON prompt_contexts(category);
      CREATE INDEX IF NOT EXISTS idx_prompt_contexts_project ON prompt_contexts(project_id);
    `);
  }

  /**
   * Migrate contexts table to add project_id column if it doesn't exist
   */
  private migrateContextsTable(): void {
    const db = this.getDb();

    // Check if project_id column exists
    const tableInfo = db.pragma('table_info(contexts)') as Array<{ name: string }>;
    const hasProjectId = tableInfo.some((col) => col.name === 'project_id');

    if (!hasProjectId) {
      // Add project_id column (null = uncategorized)
      db.exec('ALTER TABLE contexts ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL');
      db.exec('CREATE INDEX IF NOT EXISTS idx_contexts_project ON contexts(project_id)');
    }
  }

  /**
   * Migrate dictionary table to add project_id column if it doesn't exist
   */
  private migrateDictionaryTable(): void {
    const db = this.getDb();

    // Check if project_id column exists
    const tableInfo = db.pragma('table_info(dictionary)') as Array<{ name: string }>;
    const hasProjectId = tableInfo.some((col) => col.name === 'project_id');

    if (!hasProjectId) {
      // Add project_id column (null = global)
      db.exec('ALTER TABLE dictionary ADD COLUMN project_id TEXT');
      db.exec('CREATE INDEX IF NOT EXISTS idx_dictionary_project ON dictionary(project_id)');

      // Drop old unique constraint and add new one with project_id
      // SQLite doesn't support dropping constraints, so we need to recreate the table
      // For now, the UNIQUE(project_id, source) constraint is only enforced on new tables
      // Existing entries will have project_id = NULL (global)
    }
  }

  /**
   * Migrate prompt_contexts table to add project_id column if it doesn't exist
   */
  private migratePromptContextsTable(): void {
    const db = this.getDb();

    // Check if project_id column exists
    const tableInfo = db.pragma('table_info(prompt_contexts)') as Array<{ name: string }>;
    const hasProjectId = tableInfo.some((col) => col.name === 'project_id');

    if (!hasProjectId) {
      // Add project_id column (null = global)
      db.exec('ALTER TABLE prompt_contexts ADD COLUMN project_id TEXT');
      db.exec('CREATE INDEX IF NOT EXISTS idx_prompt_contexts_project ON prompt_contexts(project_id)');
    }
  }

  // Context operations

  async saveContext(context: Context): Promise<void> {
    try {
      const db = this.getDb();
      const stmt = db.prepare(`
        INSERT INTO contexts (
          id, project_id, raw_input, title, summary,
          decisions, action_items, policies, open_questions, tags,
          embedding, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        context.id,
        context.projectId,
        context.rawInput,
        context.title,
        context.summary,
        JSON.stringify(context.decisions),
        JSON.stringify(context.actionItems),
        JSON.stringify(context.policies),
        JSON.stringify(context.openQuestions),
        JSON.stringify(context.tags),
        context.embedding ? Buffer.from(context.embedding.buffer) : null,
        context.createdAt.toISOString(),
        context.updatedAt.toISOString()
      );
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to save context: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async getContext(id: string): Promise<Context | null> {
    try {
      const db = this.getDb();
      const stmt = db.prepare('SELECT * FROM contexts WHERE id = ?');
      const row = stmt.get(id) as ContextRow | undefined;

      if (!row) return null;
      return this.rowToContext(row);
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to get context: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async listContexts(options?: ListOptions): Promise<Context[]> {
    try {
      const db = this.getDb();
      let sql = 'SELECT * FROM contexts';
      const params: unknown[] = [];
      const conditions: string[] = [];

      if (options?.projectId) {
        conditions.push('project_id = ?');
        params.push(options.projectId);
      }

      if (options?.tags && options.tags.length > 0) {
        // Filter by tags (any match)
        const tagConditions = options.tags.map(() => 'tags LIKE ?');
        conditions.push(`(${tagConditions.join(' OR ')})`);
        params.push(...options.tags.map((tag) => `%"${tag}"%`));
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY created_at DESC';

      if (options?.limit) {
        sql += ' LIMIT ?';
        params.push(options.limit);
      }

      if (options?.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }

      const stmt = db.prepare(sql);
      const rows = stmt.all(...params) as ContextRow[];

      return rows.map((row) => this.rowToContext(row));
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to list contexts: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async updateContext(id: string, updates: Partial<Context>): Promise<void> {
    try {
      const db = this.getDb();
      const setClauses: string[] = [];
      const params: unknown[] = [];

      if (updates.projectId !== undefined) {
        setClauses.push('project_id = ?');
        params.push(updates.projectId);
      }
      if (updates.title !== undefined) {
        setClauses.push('title = ?');
        params.push(updates.title);
      }
      if (updates.summary !== undefined) {
        setClauses.push('summary = ?');
        params.push(updates.summary);
      }
      if (updates.decisions !== undefined) {
        setClauses.push('decisions = ?');
        params.push(JSON.stringify(updates.decisions));
      }
      if (updates.actionItems !== undefined) {
        setClauses.push('action_items = ?');
        params.push(JSON.stringify(updates.actionItems));
      }
      if (updates.policies !== undefined) {
        setClauses.push('policies = ?');
        params.push(JSON.stringify(updates.policies));
      }
      if (updates.openQuestions !== undefined) {
        setClauses.push('open_questions = ?');
        params.push(JSON.stringify(updates.openQuestions));
      }
      if (updates.tags !== undefined) {
        setClauses.push('tags = ?');
        params.push(JSON.stringify(updates.tags));
      }
      if (updates.embedding !== undefined) {
        setClauses.push('embedding = ?');
        params.push(
          updates.embedding ? Buffer.from(updates.embedding.buffer) : null
        );
      }

      setClauses.push('updated_at = ?');
      params.push(new Date().toISOString());
      params.push(id);

      const sql = `UPDATE contexts SET ${setClauses.join(', ')} WHERE id = ?`;
      db.prepare(sql).run(...params);
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to update context: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async deleteContext(id: string): Promise<void> {
    try {
      const db = this.getDb();
      db.prepare('DELETE FROM contexts WHERE id = ?').run(id);
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to delete context: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  // Search operations

  async listContextsWithEmbeddings(projectId?: string): Promise<Context[]> {
    try {
      const db = this.getDb();
      let sql = 'SELECT * FROM contexts WHERE embedding IS NOT NULL';
      const params: unknown[] = [];

      if (projectId) {
        sql += ' AND project_id = ?';
        params.push(projectId);
      }

      sql += ' ORDER BY created_at DESC';

      const stmt = db.prepare(sql);
      const rows = stmt.all(...params) as ContextRow[];

      return rows.map((row) => this.rowToContext(row));
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to list contexts with embeddings: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async searchByKeyword(
    keyword: string,
    options?: { projectId?: string; limit?: number }
  ): Promise<Context[]> {
    try {
      const db = this.getDb();
      const searchTerm = `%${keyword}%`;
      let sql = `
        SELECT * FROM contexts
        WHERE (
          title LIKE ? OR
          summary LIKE ? OR
          raw_input LIKE ? OR
          decisions LIKE ? OR
          policies LIKE ? OR
          tags LIKE ?
        )
      `;
      const params: unknown[] = [
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
      ];

      if (options?.projectId) {
        sql += ' AND project_id = ?';
        params.push(options.projectId);
      }

      sql += ' ORDER BY created_at DESC';

      if (options?.limit) {
        sql += ' LIMIT ?';
        params.push(options.limit);
      }

      const stmt = db.prepare(sql);
      const rows = stmt.all(...params) as ContextRow[];

      return rows.map((row) => this.rowToContext(row));
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to search contexts: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  // Project operations

  async saveProject(project: Project): Promise<void> {
    try {
      const db = this.getDb();
      const stmt = db.prepare(`
        INSERT INTO projects (id, name, description, created_at)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(
        project.id,
        project.name,
        project.description,
        project.createdAt.toISOString()
      );
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }

      // Check for unique constraint violation
      const message = originalError?.message?.toLowerCase() ?? '';
      if (message.includes('unique constraint')) {
        throw new StorageError(
          `Project with name "${project.name}" already exists`,
          ErrorCode.PROJECT_NAME_DUPLICATE,
          true,
          originalError
        );
      }

      throw new StorageError(
        `Failed to save project: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async getProject(id: string): Promise<Project | null> {
    try {
      const db = this.getDb();
      const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
      const row = stmt.get(id) as ProjectRow | undefined;

      if (!row) return null;
      return this.rowToProject(row);
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to get project: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async getProjectByName(name: string): Promise<Project | null> {
    try {
      const db = this.getDb();
      const stmt = db.prepare('SELECT * FROM projects WHERE name = ?');
      const row = stmt.get(name) as ProjectRow | undefined;

      if (!row) return null;
      return this.rowToProject(row);
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to get project by name: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async listProjects(): Promise<Project[]> {
    try {
      const db = this.getDb();
      const stmt = db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
      const rows = stmt.all() as ProjectRow[];

      return rows.map((row) => this.rowToProject(row));
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to list projects: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    try {
      const db = this.getDb();
      const setClauses: string[] = [];
      const params: unknown[] = [];

      if (updates.name !== undefined) {
        setClauses.push('name = ?');
        params.push(updates.name);
      }
      if (updates.description !== undefined) {
        setClauses.push('description = ?');
        params.push(updates.description);
      }

      if (setClauses.length === 0) return;

      params.push(id);
      const sql = `UPDATE projects SET ${setClauses.join(', ')} WHERE id = ?`;
      db.prepare(sql).run(...params);
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }

      // Check for unique constraint violation
      const message = originalError?.message?.toLowerCase() ?? '';
      if (message.includes('unique constraint')) {
        throw new StorageError(
          `Project with name "${updates.name}" already exists`,
          ErrorCode.PROJECT_NAME_DUPLICATE,
          true,
          originalError
        );
      }

      throw new StorageError(
        `Failed to update project: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      const db = this.getDb();
      // Set contexts to uncategorized first
      db.prepare('UPDATE contexts SET project_id = NULL WHERE project_id = ?').run(
        id
      );
      // Delete project
      db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to delete project: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  // Utility

  async getContextCount(projectId?: string): Promise<number> {
    try {
      const db = this.getDb();
      let sql = 'SELECT COUNT(*) as count FROM contexts';
      const params: unknown[] = [];

      if (projectId) {
        sql += ' WHERE project_id = ?';
        params.push(projectId);
      }

      const row = db.prepare(sql).get(...params) as { count: number };
      return row.count;
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to get context count: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  // Dictionary operations

  async saveDictionaryEntry(entry: DictionaryEntry): Promise<void> {
    try {
      const db = this.getDb();
      const stmt = db.prepare(`
        INSERT INTO dictionary (id, project_id, source, target, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        entry.id,
        entry.projectId,
        entry.source,
        entry.target,
        entry.createdAt.toISOString(),
        entry.updatedAt.toISOString()
      );
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }

      const message = originalError?.message?.toLowerCase() ?? '';
      if (message.includes('unique constraint')) {
        throw new StorageError(
          `Dictionary entry with source "${entry.source}" already exists`,
          ErrorCode.DICTIONARY_DUPLICATE_SOURCE,
          true,
          originalError
        );
      }

      throw new StorageError(
        `Failed to save dictionary entry: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async getDictionaryEntry(id: string): Promise<DictionaryEntry | null> {
    try {
      const db = this.getDb();
      const stmt = db.prepare('SELECT * FROM dictionary WHERE id = ?');
      const row = stmt.get(id) as DictionaryRow | undefined;

      if (!row) return null;
      return this.rowToDictionaryEntry(row);
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to get dictionary entry: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async getDictionaryEntryBySource(source: string): Promise<DictionaryEntry | null> {
    try {
      const db = this.getDb();
      const stmt = db.prepare('SELECT * FROM dictionary WHERE source = ?');
      const row = stmt.get(source) as DictionaryRow | undefined;

      if (!row) return null;
      return this.rowToDictionaryEntry(row);
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to get dictionary entry by source: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async listDictionaryEntries(projectId?: string | null): Promise<DictionaryEntry[]> {
    try {
      const db = this.getDb();
      let sql = 'SELECT * FROM dictionary';
      const params: unknown[] = [];

      // If projectId is undefined, return all entries
      // If projectId is null, return only global entries
      // If projectId is a string, return only entries for that project
      if (projectId !== undefined) {
        if (projectId === null) {
          sql += ' WHERE project_id IS NULL';
        } else {
          sql += ' WHERE project_id = ?';
          params.push(projectId);
        }
      }

      sql += ' ORDER BY source ASC';

      const stmt = db.prepare(sql);
      const rows = stmt.all(...params) as DictionaryRow[];

      return rows.map((row) => this.rowToDictionaryEntry(row));
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to list dictionary entries: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async updateDictionaryEntry(id: string, updates: Partial<DictionaryEntry>): Promise<void> {
    try {
      const db = this.getDb();
      const setClauses: string[] = [];
      const params: unknown[] = [];

      if (updates.source !== undefined) {
        setClauses.push('source = ?');
        params.push(updates.source);
      }
      if (updates.target !== undefined) {
        setClauses.push('target = ?');
        params.push(updates.target);
      }

      setClauses.push('updated_at = ?');
      params.push(new Date().toISOString());
      params.push(id);

      if (setClauses.length === 1) return; // Only updated_at

      const sql = `UPDATE dictionary SET ${setClauses.join(', ')} WHERE id = ?`;
      db.prepare(sql).run(...params);
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }

      const message = originalError?.message?.toLowerCase() ?? '';
      if (message.includes('unique constraint')) {
        throw new StorageError(
          `Dictionary entry with source "${updates.source}" already exists`,
          ErrorCode.DICTIONARY_DUPLICATE_SOURCE,
          true,
          originalError
        );
      }

      throw new StorageError(
        `Failed to update dictionary entry: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async deleteDictionaryEntry(id: string): Promise<void> {
    try {
      const db = this.getDb();
      db.prepare('DELETE FROM dictionary WHERE id = ?').run(id);
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to delete dictionary entry: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async getAllDictionaryMappings(projectId?: string): Promise<Map<string, string>> {
    try {
      const db = this.getDb();
      // Get global mappings first, then override with project-specific
      const mappings = new Map<string, string>();

      // Get global mappings (project_id IS NULL)
      const globalStmt = db.prepare('SELECT source, target FROM dictionary WHERE project_id IS NULL');
      const globalRows = globalStmt.all() as { source: string; target: string }[];
      for (const row of globalRows) {
        mappings.set(row.source, row.target);
      }

      // If projectId is provided, overlay with project-specific mappings
      if (projectId) {
        const projectStmt = db.prepare('SELECT source, target FROM dictionary WHERE project_id = ?');
        const projectRows = projectStmt.all(projectId) as { source: string; target: string }[];
        for (const row of projectRows) {
          mappings.set(row.source, row.target); // Overrides global
        }
      }

      return mappings;
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to get dictionary mappings: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  // PromptContext operations

  async savePromptContext(context: PromptContext): Promise<void> {
    try {
      const db = this.getDb();
      const stmt = db.prepare(`
        INSERT INTO prompt_contexts (id, project_id, category, title, content, enabled, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        context.id,
        context.projectId,
        context.category,
        context.title,
        context.content,
        context.enabled ? 1 : 0,
        context.createdAt.toISOString(),
        context.updatedAt.toISOString()
      );
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to save prompt context: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async getPromptContext(id: string): Promise<PromptContext | null> {
    try {
      const db = this.getDb();
      const stmt = db.prepare('SELECT * FROM prompt_contexts WHERE id = ?');
      const row = stmt.get(id) as PromptContextRow | undefined;

      if (!row) return null;
      return this.rowToPromptContext(row);
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to get prompt context: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async listPromptContexts(projectId?: string | null): Promise<PromptContext[]> {
    try {
      const db = this.getDb();
      let sql = 'SELECT * FROM prompt_contexts';
      const params: unknown[] = [];

      // If projectId is undefined, return all entries
      // If projectId is null, return only global entries
      // If projectId is a string, return only entries for that project
      if (projectId !== undefined) {
        if (projectId === null) {
          sql += ' WHERE project_id IS NULL';
        } else {
          sql += ' WHERE project_id = ?';
          params.push(projectId);
        }
      }

      sql += ' ORDER BY created_at DESC';

      const stmt = db.prepare(sql);
      const rows = stmt.all(...params) as PromptContextRow[];

      return rows.map((row) => this.rowToPromptContext(row));
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to list prompt contexts: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async listEnabledPromptContexts(projectId?: string): Promise<PromptContext[]> {
    try {
      const db = this.getDb();
      // Get global enabled contexts first
      const contexts: PromptContext[] = [];

      const globalStmt = db.prepare('SELECT * FROM prompt_contexts WHERE enabled = 1 AND project_id IS NULL ORDER BY created_at DESC');
      const globalRows = globalStmt.all() as PromptContextRow[];
      contexts.push(...globalRows.map((row) => this.rowToPromptContext(row)));

      // If projectId is provided, add project-specific enabled contexts
      if (projectId) {
        const projectStmt = db.prepare('SELECT * FROM prompt_contexts WHERE enabled = 1 AND project_id = ? ORDER BY created_at DESC');
        const projectRows = projectStmt.all(projectId) as PromptContextRow[];
        contexts.push(...projectRows.map((row) => this.rowToPromptContext(row)));
      }

      return contexts;
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to list enabled prompt contexts: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async updatePromptContext(id: string, updates: Partial<PromptContext>): Promise<void> {
    try {
      const db = this.getDb();
      const setClauses: string[] = [];
      const params: unknown[] = [];

      if (updates.category !== undefined) {
        setClauses.push('category = ?');
        params.push(updates.category);
      }
      if (updates.title !== undefined) {
        setClauses.push('title = ?');
        params.push(updates.title);
      }
      if (updates.content !== undefined) {
        setClauses.push('content = ?');
        params.push(updates.content);
      }
      if (updates.enabled !== undefined) {
        setClauses.push('enabled = ?');
        params.push(updates.enabled ? 1 : 0);
      }

      setClauses.push('updated_at = ?');
      params.push(new Date().toISOString());
      params.push(id);

      if (setClauses.length === 1) return; // Only updated_at

      const sql = `UPDATE prompt_contexts SET ${setClauses.join(', ')} WHERE id = ?`;
      db.prepare(sql).run(...params);
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to update prompt context: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  async deletePromptContext(id: string): Promise<void> {
    try {
      const db = this.getDb();
      db.prepare('DELETE FROM prompt_contexts WHERE id = ?').run(id);
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      if (originalError instanceof StorageError) {
        throw originalError;
      }
      throw new StorageError(
        `Failed to delete prompt context: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  // Helper methods

  private rowToContext(row: ContextRow): Context {
    try {
      return {
        id: row.id,
        projectId: row.project_id,
        rawInput: row.raw_input,
        title: row.title,
        summary: row.summary || '',
        decisions: JSON.parse(row.decisions || '[]'),
        actionItems: JSON.parse(row.action_items || '[]') as ActionItem[],
        policies: JSON.parse(row.policies || '[]'),
        openQuestions: JSON.parse(row.open_questions || '[]'),
        tags: JSON.parse(row.tags || '[]'),
        embedding: row.embedding
          ? new Float32Array(row.embedding.buffer)
          : null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      throw new StorageError(
        `Failed to parse context data: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.DB_QUERY_FAILED,
        true,
        originalError
      );
    }
  }

  private rowToProject(row: ProjectRow): Project {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.created_at),
    };
  }

  private rowToDictionaryEntry(row: DictionaryRow): DictionaryEntry {
    return {
      id: row.id,
      projectId: row.project_id,
      source: row.source,
      target: row.target,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private rowToPromptContext(row: PromptContextRow): PromptContext {
    return {
      id: row.id,
      projectId: row.project_id,
      category: row.category as PromptContextCategory,
      title: row.title,
      content: row.content,
      enabled: row.enabled === 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

// Type definitions for database rows
interface ContextRow {
  id: string;
  project_id: string | null;
  raw_input: string;
  title: string;
  summary: string | null;
  decisions: string | null;
  action_items: string | null;
  policies: string | null;
  open_questions: string | null;
  tags: string | null;
  embedding: Buffer | null;
  created_at: string;
  updated_at: string;
}

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface DictionaryRow {
  id: string;
  project_id: string | null;
  source: string;
  target: string;
  created_at: string;
  updated_at: string;
}

interface PromptContextRow {
  id: string;
  project_id: string | null;
  category: string;
  title: string;
  content: string;
  enabled: number;
  created_at: string;
  updated_at: string;
}
