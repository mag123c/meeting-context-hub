import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import type { StorageProvider } from './storage.interface.js';
import type { Context, Project, ListOptions, ActionItem } from '../../types/index.js';

/**
 * SQLite storage adapter
 */
export class SQLiteAdapter implements StorageProvider {
  private db: Database.Database | null = null;

  constructor(private readonly dbPath: string) {}

  async initialize(): Promise<void> {
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
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private getDb(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
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

    // Indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_contexts_project ON contexts(project_id);
      CREATE INDEX IF NOT EXISTS idx_contexts_created ON contexts(created_at DESC);
    `);
  }

  // Context operations

  async saveContext(context: Context): Promise<void> {
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
  }

  async getContext(id: string): Promise<Context | null> {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM contexts WHERE id = ?');
    const row = stmt.get(id) as ContextRow | undefined;

    if (!row) return null;
    return this.rowToContext(row);
  }

  async listContexts(options?: ListOptions): Promise<Context[]> {
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
      params.push(...options.tags.map(tag => `%"${tag}"%`));
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

    return rows.map(row => this.rowToContext(row));
  }

  async updateContext(id: string, updates: Partial<Context>): Promise<void> {
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
      params.push(updates.embedding ? Buffer.from(updates.embedding.buffer) : null);
    }

    setClauses.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const sql = `UPDATE contexts SET ${setClauses.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);
  }

  async deleteContext(id: string): Promise<void> {
    const db = this.getDb();
    db.prepare('DELETE FROM contexts WHERE id = ?').run(id);
  }

  // Search operations

  async listContextsWithEmbeddings(projectId?: string): Promise<Context[]> {
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

    return rows.map(row => this.rowToContext(row));
  }

  async searchByKeyword(
    keyword: string,
    options?: { projectId?: string; limit?: number }
  ): Promise<Context[]> {
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
    const params: unknown[] = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];

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

    return rows.map(row => this.rowToContext(row));
  }

  // Project operations

  async saveProject(project: Project): Promise<void> {
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
  }

  async getProject(id: string): Promise<Project | null> {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
    const row = stmt.get(id) as ProjectRow | undefined;

    if (!row) return null;
    return this.rowToProject(row);
  }

  async getProjectByName(name: string): Promise<Project | null> {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM projects WHERE name = ?');
    const row = stmt.get(name) as ProjectRow | undefined;

    if (!row) return null;
    return this.rowToProject(row);
  }

  async listProjects(): Promise<Project[]> {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
    const rows = stmt.all() as ProjectRow[];

    return rows.map(row => this.rowToProject(row));
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
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
  }

  async deleteProject(id: string): Promise<void> {
    const db = this.getDb();
    // Set contexts to uncategorized first
    db.prepare('UPDATE contexts SET project_id = NULL WHERE project_id = ?').run(id);
    // Delete project
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  }

  // Utility

  async getContextCount(projectId?: string): Promise<number> {
    const db = this.getDb();
    let sql = 'SELECT COUNT(*) as count FROM contexts';
    const params: unknown[] = [];

    if (projectId) {
      sql += ' WHERE project_id = ?';
      params.push(projectId);
    }

    const row = db.prepare(sql).get(...params) as { count: number };
    return row.count;
  }

  // Helper methods

  private rowToContext(row: ContextRow): Context {
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
      embedding: row.embedding ? new Float32Array(row.embedding.buffer) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private rowToProject(row: ProjectRow): Project {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: new Date(row.created_at),
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
