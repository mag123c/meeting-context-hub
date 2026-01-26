import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManageContextUseCase } from './manage-context.usecase.js';
import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { Context, Project } from '../../types/index.js';

describe('ManageContextUseCase', () => {
  let useCase: ManageContextUseCase;
  let mockStorage: StorageProvider;

  const mockContext: Context = {
    id: 'ctx-123',
    rawInput: 'Test meeting notes',
    summary: 'Test summary',
    decisions: ['Decision 1'],
    actionItems: [],
    policies: [],
    openQuestions: [],
    tags: ['test'],
    createdAt: new Date('2024-01-01'),
    projectId: 'proj-1',
    embedding: null,
  };

  const mockProject: Project = {
    id: 'proj-1',
    name: 'Test Project',
    description: null,
    createdAt: new Date('2024-01-01'),
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
    };
    useCase = new ManageContextUseCase(mockStorage);
  });

  describe('deleteContext', () => {
    it('should delete context successfully', async () => {
      vi.mocked(mockStorage.getContext).mockResolvedValue(mockContext);
      vi.mocked(mockStorage.deleteContext).mockResolvedValue();

      await useCase.deleteContext('ctx-123');

      expect(mockStorage.getContext).toHaveBeenCalledWith('ctx-123');
      expect(mockStorage.deleteContext).toHaveBeenCalledWith('ctx-123');
    });

    it('should throw error when context not found', async () => {
      vi.mocked(mockStorage.getContext).mockResolvedValue(null);

      await expect(useCase.deleteContext('non-existent')).rejects.toThrow(
        'Context not found'
      );
      expect(mockStorage.deleteContext).not.toHaveBeenCalled();
    });
  });

  describe('changeGroup', () => {
    it('should change context group successfully', async () => {
      vi.mocked(mockStorage.getContext).mockResolvedValue(mockContext);
      vi.mocked(mockStorage.getProject).mockResolvedValue(mockProject);
      vi.mocked(mockStorage.updateContext).mockResolvedValue();

      await useCase.changeGroup('ctx-123', 'proj-1');

      expect(mockStorage.getContext).toHaveBeenCalledWith('ctx-123');
      expect(mockStorage.getProject).toHaveBeenCalledWith('proj-1');
      expect(mockStorage.updateContext).toHaveBeenCalledWith('ctx-123', {
        projectId: 'proj-1',
      });
    });

    it('should set group to null (uncategorized)', async () => {
      vi.mocked(mockStorage.getContext).mockResolvedValue(mockContext);
      vi.mocked(mockStorage.updateContext).mockResolvedValue();

      await useCase.changeGroup('ctx-123', null);

      expect(mockStorage.updateContext).toHaveBeenCalledWith('ctx-123', {
        projectId: null,
      });
      // Should not check project when setting to null
      expect(mockStorage.getProject).not.toHaveBeenCalled();
    });

    it('should throw error when context not found', async () => {
      vi.mocked(mockStorage.getContext).mockResolvedValue(null);

      await expect(useCase.changeGroup('non-existent', 'proj-1')).rejects.toThrow(
        'Context not found'
      );
      expect(mockStorage.updateContext).not.toHaveBeenCalled();
    });

    it('should throw error when target project not found', async () => {
      vi.mocked(mockStorage.getContext).mockResolvedValue(mockContext);
      vi.mocked(mockStorage.getProject).mockResolvedValue(null);

      await expect(useCase.changeGroup('ctx-123', 'non-existent')).rejects.toThrow(
        'Project not found'
      );
      expect(mockStorage.updateContext).not.toHaveBeenCalled();
    });
  });
});
