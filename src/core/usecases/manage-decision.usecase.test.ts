import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManageDecisionUseCase } from './manage-decision.usecase.js';
import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { Decision } from '../../types/index.js';

describe('ManageDecisionUseCase', () => {
  let useCase: ManageDecisionUseCase;
  let mockStorage: StorageProvider;

  const mockDecision: Decision = {
    id: 'dec-1',
    contextId: 'ctx-1',
    projectId: 'proj-1',
    content: 'Use REST API',
    status: 'active',
    supersededBy: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    mockStorage = {
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
      saveDictionaryEntry: vi.fn(),
      getDictionaryEntry: vi.fn(),
      getDictionaryEntryBySource: vi.fn(),
      listDictionaryEntries: vi.fn(),
      updateDictionaryEntry: vi.fn(),
      deleteDictionaryEntry: vi.fn(),
      getAllDictionaryMappings: vi.fn(),
      savePromptContext: vi.fn(),
      getPromptContext: vi.fn(),
      listPromptContexts: vi.fn(),
      listEnabledPromptContexts: vi.fn(),
      updatePromptContext: vi.fn(),
      deletePromptContext: vi.fn(),
      saveDecision: vi.fn(),
      getDecision: vi.fn(),
      listDecisionsByProject: vi.fn(),
      listDecisionsByContext: vi.fn(),
      updateDecision: vi.fn(),
      deleteDecision: vi.fn(),
      deleteDecisionsByContext: vi.fn(),
      updateDecisionProjectByContext: vi.fn(),
    };
    useCase = new ManageDecisionUseCase(mockStorage);
  });

  describe('create', () => {
    it('should create a decision and save it', async () => {
      vi.mocked(mockStorage.saveDecision).mockResolvedValue();

      const result = await useCase.create({
        contextId: 'ctx-1',
        projectId: 'proj-1',
        content: 'Use REST API',
      });

      expect(result.contextId).toBe('ctx-1');
      expect(result.projectId).toBe('proj-1');
      expect(result.content).toBe('Use REST API');
      expect(result.status).toBe('active');
      expect(result.id).toBeDefined();
      expect(mockStorage.saveDecision).toHaveBeenCalledWith(expect.objectContaining({
        contextId: 'ctx-1',
        content: 'Use REST API',
      }));
    });

    it('should create a decision with custom status', async () => {
      vi.mocked(mockStorage.saveDecision).mockResolvedValue();

      const result = await useCase.create({
        contextId: 'ctx-1',
        content: 'Pending decision',
        status: 'pending',
      });

      expect(result.status).toBe('pending');
    });

    it('should default projectId to null', async () => {
      vi.mocked(mockStorage.saveDecision).mockResolvedValue();

      const result = await useCase.create({
        contextId: 'ctx-1',
        content: 'D1',
      });

      expect(result.projectId).toBeNull();
    });
  });

  describe('listByProject', () => {
    it('should list decisions by project', async () => {
      vi.mocked(mockStorage.listDecisionsByProject).mockResolvedValue([mockDecision]);

      const result = await useCase.listByProject('proj-1');

      expect(result).toHaveLength(1);
      expect(mockStorage.listDecisionsByProject).toHaveBeenCalledWith('proj-1', undefined);
    });

    it('should list decisions by project with status filter', async () => {
      vi.mocked(mockStorage.listDecisionsByProject).mockResolvedValue([mockDecision]);

      await useCase.listByProject('proj-1', { status: 'active' });

      expect(mockStorage.listDecisionsByProject).toHaveBeenCalledWith('proj-1', { status: 'active' });
    });
  });

  describe('listByContext', () => {
    it('should list decisions by context', async () => {
      vi.mocked(mockStorage.listDecisionsByContext).mockResolvedValue([mockDecision]);

      const result = await useCase.listByContext('ctx-1');

      expect(result).toHaveLength(1);
      expect(mockStorage.listDecisionsByContext).toHaveBeenCalledWith('ctx-1');
    });
  });

  describe('updateStatus', () => {
    it('should update decision status', async () => {
      vi.mocked(mockStorage.getDecision).mockResolvedValue(mockDecision);
      vi.mocked(mockStorage.updateDecision).mockResolvedValue();

      await useCase.updateStatus('dec-1', { status: 'superseded', supersededBy: 'dec-2' });

      expect(mockStorage.updateDecision).toHaveBeenCalledWith('dec-1', {
        status: 'superseded',
        supersededBy: 'dec-2',
      });
    });

    it('should update status without supersededBy', async () => {
      vi.mocked(mockStorage.getDecision).mockResolvedValue(mockDecision);
      vi.mocked(mockStorage.updateDecision).mockResolvedValue();

      await useCase.updateStatus('dec-1', { status: 'pending' });

      expect(mockStorage.updateDecision).toHaveBeenCalledWith('dec-1', {
        status: 'pending',
        supersededBy: null,
      });
    });

    it('should throw if decision not found', async () => {
      vi.mocked(mockStorage.getDecision).mockResolvedValue(null);

      await expect(useCase.updateStatus('non-existent', { status: 'active' }))
        .rejects.toThrow('Decision not found');
      expect(mockStorage.updateDecision).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a decision', async () => {
      vi.mocked(mockStorage.getDecision).mockResolvedValue(mockDecision);
      vi.mocked(mockStorage.deleteDecision).mockResolvedValue();

      await useCase.delete('dec-1');

      expect(mockStorage.deleteDecision).toHaveBeenCalledWith('dec-1');
    });

    it('should throw if decision not found', async () => {
      vi.mocked(mockStorage.getDecision).mockResolvedValue(null);

      await expect(useCase.delete('non-existent')).rejects.toThrow('Decision not found');
      expect(mockStorage.deleteDecision).not.toHaveBeenCalled();
    });
  });
});
