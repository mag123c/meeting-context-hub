import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DictionaryService } from './dictionary.service.js';
import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { DictionaryEntry } from '../../types/index.js';

// Mock storage provider
function createMockStorage(entries: DictionaryEntry[] = []): StorageProvider {
  const store = new Map<string, DictionaryEntry>();
  entries.forEach((e) => store.set(e.id, e));

  return {
    // Dictionary methods
    saveDictionaryEntry: vi.fn(async (entry: DictionaryEntry) => {
      store.set(entry.id, entry);
    }),
    getDictionaryEntry: vi.fn(async (id: string) => store.get(id) || null),
    getDictionaryEntryBySource: vi.fn(async (source: string) => {
      for (const entry of store.values()) {
        if (entry.source === source) return entry;
      }
      return null;
    }),
    listDictionaryEntries: vi.fn(async () => Array.from(store.values())),
    updateDictionaryEntry: vi.fn(async (id: string, updates: Partial<DictionaryEntry>) => {
      const existing = store.get(id);
      if (existing) {
        store.set(id, { ...existing, ...updates, updatedAt: new Date() });
      }
    }),
    deleteDictionaryEntry: vi.fn(async (id: string) => {
      store.delete(id);
    }),
    getAllDictionaryMappings: vi.fn(async () => {
      const mappings = new Map<string, string>();
      for (const entry of store.values()) {
        mappings.set(entry.source, entry.target);
      }
      return mappings;
    }),
    // Other required methods (not used in tests)
    initialize: vi.fn(),
    close: vi.fn(),
    saveContext: vi.fn(),
    getContext: vi.fn(),
    listContexts: vi.fn(),
    updateContext: vi.fn(),
    deleteContext: vi.fn(),
    listContextsWithEmbeddings: vi.fn(),
    searchByKeyword: vi.fn(),
    saveProject: vi.fn(),
    getProject: vi.fn(),
    getProjectByName: vi.fn(),
    listProjects: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    getContextCount: vi.fn(),
  };
}

describe('DictionaryService', () => {
  describe('CRUD operations', () => {
    it('should add a new entry', async () => {
      const storage = createMockStorage();
      const service = new DictionaryService(storage);

      const entry = await service.addEntry('임포크', '인포크');

      expect(entry.source).toBe('임포크');
      expect(entry.target).toBe('인포크');
      expect(entry.id).toBeDefined();
      expect(storage.saveDictionaryEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          source: '임포크',
          target: '인포크',
        })
      );
    });

    it('should list all entries', async () => {
      const existingEntries: DictionaryEntry[] = [
        { id: '1', source: '클로드', target: 'Claude', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', source: '오픈에이아이', target: 'OpenAI', createdAt: new Date(), updatedAt: new Date() },
      ];
      const storage = createMockStorage(existingEntries);
      const service = new DictionaryService(storage);

      const entries = await service.listEntries();

      expect(entries).toHaveLength(2);
      expect(entries[0].source).toBe('클로드');
      expect(entries[1].source).toBe('오픈에이아이');
    });

    it('should update an entry', async () => {
      const existingEntries: DictionaryEntry[] = [
        { id: '1', source: '클로드', target: 'Claude', createdAt: new Date(), updatedAt: new Date() },
      ];
      const storage = createMockStorage(existingEntries);
      const service = new DictionaryService(storage);

      await service.updateEntry('1', { target: 'Claude AI' });

      expect(storage.updateDictionaryEntry).toHaveBeenCalledWith('1', { target: 'Claude AI' });
    });

    it('should delete an entry', async () => {
      const existingEntries: DictionaryEntry[] = [
        { id: '1', source: '클로드', target: 'Claude', createdAt: new Date(), updatedAt: new Date() },
      ];
      const storage = createMockStorage(existingEntries);
      const service = new DictionaryService(storage);

      await service.deleteEntry('1');

      expect(storage.deleteDictionaryEntry).toHaveBeenCalledWith('1');
    });

    it('should get entry by id', async () => {
      const existingEntries: DictionaryEntry[] = [
        { id: '1', source: '클로드', target: 'Claude', createdAt: new Date(), updatedAt: new Date() },
      ];
      const storage = createMockStorage(existingEntries);
      const service = new DictionaryService(storage);

      const entry = await service.getEntry('1');

      expect(entry).not.toBeNull();
      expect(entry?.source).toBe('클로드');
    });
  });

  describe('correctText', () => {
    let storage: StorageProvider;
    let service: DictionaryService;

    beforeEach(() => {
      const existingEntries: DictionaryEntry[] = [
        { id: '1', source: '임포크', target: '인포크', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', source: '클로드', target: 'Claude', createdAt: new Date(), updatedAt: new Date() },
        { id: '3', source: '오픈에이아이', target: 'OpenAI', createdAt: new Date(), updatedAt: new Date() },
      ];
      storage = createMockStorage(existingEntries);
      service = new DictionaryService(storage);
    });

    it('should replace single occurrence', async () => {
      const result = await service.correctText('임포크 회의에서 논의');

      expect(result).toBe('인포크 회의에서 논의');
    });

    it('should replace multiple occurrences', async () => {
      const result = await service.correctText('임포크와 클로드 연동');

      expect(result).toBe('인포크와 Claude 연동');
    });

    it('should handle case-insensitive matching', async () => {
      const entriesWithCase: DictionaryEntry[] = [
        { id: '1', source: 'api', target: 'API', createdAt: new Date(), updatedAt: new Date() },
      ];
      const s = createMockStorage(entriesWithCase);
      const svc = new DictionaryService(s);

      const result = await svc.correctText('API 문서');

      expect(result).toBe('API 문서');
    });

    it('should return original text if no matches', async () => {
      const result = await service.correctText('안녕하세요');

      expect(result).toBe('안녕하세요');
    });

    it('should return empty string for empty input', async () => {
      const result = await service.correctText('');

      expect(result).toBe('');
    });

    it('should handle longer sources first to avoid partial matches', async () => {
      const entries: DictionaryEntry[] = [
        { id: '1', source: 'AI', target: '인공지능', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', source: 'AI 모델', target: '인공지능 모델', createdAt: new Date(), updatedAt: new Date() },
      ];
      const s = createMockStorage(entries);
      const svc = new DictionaryService(s);

      const result = await svc.correctText('AI 모델을 사용');

      expect(result).toBe('인공지능 모델을 사용');
    });

    it('should cache mappings and reload on demand', async () => {
      await service.correctText('임포크');

      // First call should load mappings
      expect(storage.getAllDictionaryMappings).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await service.correctText('클로드');
      expect(storage.getAllDictionaryMappings).toHaveBeenCalledTimes(1);

      // After invalidating cache
      service.invalidateCache();
      await service.correctText('임포크');
      expect(storage.getAllDictionaryMappings).toHaveBeenCalledTimes(2);
    });

    it('should auto-invalidate cache after addEntry', async () => {
      await service.correctText('임포크');
      expect(storage.getAllDictionaryMappings).toHaveBeenCalledTimes(1);

      await service.addEntry('새로운', '신규');
      await service.correctText('새로운 용어');
      expect(storage.getAllDictionaryMappings).toHaveBeenCalledTimes(2);
    });

    it('should auto-invalidate cache after updateEntry', async () => {
      await service.correctText('임포크');
      expect(storage.getAllDictionaryMappings).toHaveBeenCalledTimes(1);

      await service.updateEntry('1', { target: 'Infork' });
      await service.correctText('임포크');
      expect(storage.getAllDictionaryMappings).toHaveBeenCalledTimes(2);
    });

    it('should auto-invalidate cache after deleteEntry', async () => {
      await service.correctText('임포크');
      expect(storage.getAllDictionaryMappings).toHaveBeenCalledTimes(1);

      await service.deleteEntry('1');
      await service.correctText('임포크');
      expect(storage.getAllDictionaryMappings).toHaveBeenCalledTimes(2);
    });
  });
});
