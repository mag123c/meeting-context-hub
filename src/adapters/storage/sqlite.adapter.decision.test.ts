import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { SQLiteAdapter } from './sqlite.adapter.js';
import { createDecision } from '../../core/domain/decision.js';
import type { Context, Project } from '../../types/index.js';

describe('SQLiteAdapter - Decision operations', () => {
  let adapter: SQLiteAdapter;
  let tempDir: string;
  let dbPath: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'mch-test-'));
    dbPath = join(tempDir, 'test.db');
    adapter = new SQLiteAdapter(dbPath);
    await adapter.initialize();
  });

  afterEach(() => {
    adapter.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  const makeProject = (id: string): Project => ({
    id,
    name: `Project ${id}`,
    description: null,
    createdAt: new Date('2024-01-01'),
  });

  const makeContext = (id: string, decisions: string[] = [], projectId: string | null = null): Context => ({
    id,
    projectId,
    rawInput: 'test input',
    title: 'Test',
    summary: 'Test summary',
    decisions,
    actionItems: [],
    policies: [],
    openQuestions: [],
    tags: [],
    embedding: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

  describe('CRUD', () => {
    it('should save and get a decision', async () => {
      await adapter.saveContext(makeContext('ctx-1'));
      const decision = createDecision('ctx-1', 'Use REST API', null);
      await adapter.saveDecision(decision);

      const retrieved = await adapter.getDecision(decision.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.content).toBe('Use REST API');
      expect(retrieved!.contextId).toBe('ctx-1');
      expect(retrieved!.status).toBe('active');
      expect(retrieved!.supersededBy).toBeNull();
    });

    it('should return null for non-existent decision', async () => {
      const result = await adapter.getDecision('non-existent');
      expect(result).toBeNull();
    });

    it('should list decisions by context', async () => {
      await adapter.saveContext(makeContext('ctx-1'));
      const d1 = createDecision('ctx-1', 'Decision 1');
      const d2 = createDecision('ctx-1', 'Decision 2');
      await adapter.saveDecision(d1);
      await adapter.saveDecision(d2);

      const decisions = await adapter.listDecisionsByContext('ctx-1');
      expect(decisions).toHaveLength(2);
    });

    it('should list decisions by project', async () => {
      await adapter.saveProject(makeProject('proj-1'));
      await adapter.saveProject(makeProject('proj-2'));
      await adapter.saveContext(makeContext('ctx-1', [], 'proj-1'));
      await adapter.saveContext(makeContext('ctx-2', [], 'proj-1'));
      await adapter.saveContext(makeContext('ctx-3', [], 'proj-2'));

      const d1 = createDecision('ctx-1', 'D1', 'proj-1');
      const d2 = createDecision('ctx-2', 'D2', 'proj-1');
      const d3 = createDecision('ctx-3', 'D3', 'proj-2');
      await adapter.saveDecision(d1);
      await adapter.saveDecision(d2);
      await adapter.saveDecision(d3);

      const decisions = await adapter.listDecisionsByProject('proj-1');
      expect(decisions).toHaveLength(2);
    });

    it('should list decisions by project with status filter', async () => {
      await adapter.saveProject(makeProject('proj-1'));
      await adapter.saveContext(makeContext('ctx-1', [], 'proj-1'));
      const d1 = createDecision('ctx-1', 'Active D', 'proj-1', 'active');
      const d2 = createDecision('ctx-1', 'Superseded D', 'proj-1', 'superseded');
      await adapter.saveDecision(d1);
      await adapter.saveDecision(d2);

      const active = await adapter.listDecisionsByProject('proj-1', { status: 'active' });
      expect(active).toHaveLength(1);
      expect(active[0].content).toBe('Active D');
    });

    it('should update a decision status', async () => {
      await adapter.saveContext(makeContext('ctx-1'));
      const decision = createDecision('ctx-1', 'D1');
      await adapter.saveDecision(decision);

      await adapter.updateDecision(decision.id, { status: 'superseded', supersededBy: 'new-id' });

      const updated = await adapter.getDecision(decision.id);
      expect(updated!.status).toBe('superseded');
      expect(updated!.supersededBy).toBe('new-id');
    });

    it('should delete a decision', async () => {
      await adapter.saveContext(makeContext('ctx-1'));
      const decision = createDecision('ctx-1', 'D1');
      await adapter.saveDecision(decision);

      await adapter.deleteDecision(decision.id);

      const result = await adapter.getDecision(decision.id);
      expect(result).toBeNull();
    });

    it('should delete decisions by context', async () => {
      await adapter.saveContext(makeContext('ctx-1'));
      await adapter.saveDecision(createDecision('ctx-1', 'D1'));
      await adapter.saveDecision(createDecision('ctx-1', 'D2'));

      await adapter.deleteDecisionsByContext('ctx-1');

      const decisions = await adapter.listDecisionsByContext('ctx-1');
      expect(decisions).toHaveLength(0);
    });

    it('should update decision project by context', async () => {
      await adapter.saveContext(makeContext('ctx-1'));
      const d = createDecision('ctx-1', 'D1', null);
      await adapter.saveDecision(d);

      await adapter.updateDecisionProjectByContext('ctx-1', 'proj-new');

      const updated = await adapter.getDecision(d.id);
      expect(updated!.projectId).toBe('proj-new');
    });

    it('should enforce UNIQUE(context_id, content)', async () => {
      await adapter.saveContext(makeContext('ctx-1'));
      const d1 = createDecision('ctx-1', 'Same content');
      const d2 = createDecision('ctx-1', 'Same content');
      await adapter.saveDecision(d1);

      await expect(adapter.saveDecision(d2)).rejects.toThrow();
    });
  });

  describe('Derived ctx.decisions', () => {
    it('should derive decisions from decisions table in getContext', async () => {
      await adapter.saveContext(makeContext('ctx-1', ['old-decision']));
      await adapter.saveDecision(createDecision('ctx-1', 'New Decision A'));
      await adapter.saveDecision(createDecision('ctx-1', 'New Decision B'));

      const context = await adapter.getContext('ctx-1');
      expect(context).not.toBeNull();
      expect(context!.decisions).toEqual(['New Decision A', 'New Decision B']);
    });

    it('should derive decisions in listContexts', async () => {
      await adapter.saveContext(makeContext('ctx-1'));
      await adapter.saveDecision(createDecision('ctx-1', 'D1'));

      const contexts = await adapter.listContexts();
      expect(contexts[0].decisions).toEqual(['D1']);
    });

    it('should return empty array when no active decisions via getContext', async () => {
      await adapter.saveContext(makeContext('ctx-1'));
      const d = createDecision('ctx-1', 'D1');
      await adapter.saveDecision(d);
      await adapter.updateDecision(d.id, { status: 'superseded' });

      const context = await adapter.getContext('ctx-1');
      expect(context!.decisions).toEqual([]);
    });

    it('should return empty array when no active decisions via listContexts', async () => {
      await adapter.saveContext(makeContext('ctx-1', ['stale JSON value']));
      const d = createDecision('ctx-1', 'D1');
      await adapter.saveDecision(d);
      await adapter.updateDecision(d.id, { status: 'superseded' });

      const contexts = await adapter.listContexts();
      expect(contexts[0].decisions).toEqual([]);
    });

    it('should only return active decisions', async () => {
      await adapter.saveContext(makeContext('ctx-1'));
      const d1 = createDecision('ctx-1', 'Active', null, 'active');
      const d2 = createDecision('ctx-1', 'Superseded', null, 'superseded');
      const d3 = createDecision('ctx-1', 'Pending', null, 'pending');
      await adapter.saveDecision(d1);
      await adapter.saveDecision(d2);
      await adapter.saveDecision(d3);

      const context = await adapter.getContext('ctx-1');
      expect(context!.decisions).toEqual(['Active']);
    });
  });

  describe('Backfill', () => {
    it('should backfill existing ctx.decisions into decisions table', async () => {
      // Save a context with decisions in JSON column
      await adapter.saveContext(makeContext('ctx-1', ['Decision A', 'Decision B']));
      adapter.close();

      // Manually remove the backfill migration flag to simulate pre-upgrade DB
      const raw = new Database(dbPath);
      raw.prepare("DELETE FROM _migrations WHERE name = 'decisions_backfill'").run();
      raw.prepare('DELETE FROM decisions').run();
      raw.close();

      // Reinitialize — should trigger backfill
      adapter = new SQLiteAdapter(dbPath);
      await adapter.initialize();

      const decisions = await adapter.listDecisionsByContext('ctx-1');
      expect(decisions).toHaveLength(2);
      expect(decisions.map((d) => d.content).sort()).toEqual(['Decision A', 'Decision B']);
      expect(decisions[0].status).toBe('active');
    });

    it('should be idempotent (second init does not duplicate)', async () => {
      await adapter.saveContext(makeContext('ctx-1', ['Decision A']));
      adapter.close();

      // Reset migration flag + decisions
      const raw = new Database(dbPath);
      raw.prepare("DELETE FROM _migrations WHERE name = 'decisions_backfill'").run();
      raw.prepare('DELETE FROM decisions').run();
      raw.close();

      // First reinit — backfills
      adapter = new SQLiteAdapter(dbPath);
      await adapter.initialize();

      // Second reinit — should NOT duplicate
      adapter.close();
      adapter = new SQLiteAdapter(dbPath);
      await adapter.initialize();

      const decisions = await adapter.listDecisionsByContext('ctx-1');
      expect(decisions).toHaveLength(1);
    });

    it('should derive decisions from backfilled data', async () => {
      await adapter.saveContext(makeContext('ctx-1', ['Backfilled D']));
      adapter.close();

      // Reset migration flag + decisions
      const raw = new Database(dbPath);
      raw.prepare("DELETE FROM _migrations WHERE name = 'decisions_backfill'").run();
      raw.prepare('DELETE FROM decisions').run();
      raw.close();

      // Reinitialize to trigger backfill
      adapter = new SQLiteAdapter(dbPath);
      await adapter.initialize();

      const context = await adapter.getContext('ctx-1');
      expect(context!.decisions).toEqual(['Backfilled D']);
    });
  });

  describe('deleteContext cascades decisions', () => {
    it('should delete decisions when context is deleted', async () => {
      await adapter.saveContext(makeContext('ctx-1'));
      await adapter.saveDecision(createDecision('ctx-1', 'D1'));
      await adapter.saveDecision(createDecision('ctx-1', 'D2'));

      await adapter.deleteContext('ctx-1');

      const decisions = await adapter.listDecisionsByContext('ctx-1');
      expect(decisions).toHaveLength(0);
    });
  });
});
