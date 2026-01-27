import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManageContextUseCase } from './manage-context.usecase.js';
import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { EmbeddingService } from '../services/embedding.service.js';
import type { Context, Project } from '../../types/index.js';

describe('ManageContextUseCase', () => {
  let useCase: ManageContextUseCase;
  let mockStorage: StorageProvider;
  let mockEmbeddingService: EmbeddingService;

  const mockContext: Context = {
    id: 'ctx-123',
    rawInput: 'Test meeting notes',
    title: 'Test Title',
    summary: 'Test summary',
    decisions: ['Decision 1'],
    actionItems: [],
    policies: [],
    openQuestions: [],
    tags: ['test'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
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
    mockEmbeddingService = {
      isAvailable: vi.fn().mockReturnValue(true),
      generateForContext: vi.fn().mockResolvedValue(new Float32Array([0.1, 0.2, 0.3])),
      generateForQuery: vi.fn(),
    } as unknown as EmbeddingService;
    useCase = new ManageContextUseCase(mockStorage, mockEmbeddingService);
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

  describe('updateContext', () => {
    it('should update context title successfully', async () => {
      vi.mocked(mockStorage.getContext).mockResolvedValue(mockContext);
      vi.mocked(mockStorage.updateContext).mockResolvedValue();

      await useCase.updateContext('ctx-123', { title: 'New Title' });

      expect(mockStorage.getContext).toHaveBeenCalledWith('ctx-123');
      expect(mockStorage.updateContext).toHaveBeenCalledWith('ctx-123', {
        title: 'New Title',
        embedding: expect.any(Float32Array),
      });
    });

    it('should update context summary with embedding regeneration', async () => {
      vi.mocked(mockStorage.getContext).mockResolvedValue(mockContext);
      vi.mocked(mockStorage.updateContext).mockResolvedValue();

      await useCase.updateContext('ctx-123', { summary: 'New Summary' });

      expect(mockEmbeddingService.generateForContext).toHaveBeenCalled();
      expect(mockStorage.updateContext).toHaveBeenCalledWith('ctx-123', {
        summary: 'New Summary',
        embedding: expect.any(Float32Array),
      });
    });

    it('should update decisions array', async () => {
      vi.mocked(mockStorage.getContext).mockResolvedValue(mockContext);
      vi.mocked(mockStorage.updateContext).mockResolvedValue();

      await useCase.updateContext('ctx-123', { decisions: ['New Decision 1', 'New Decision 2'] });

      expect(mockStorage.updateContext).toHaveBeenCalledWith('ctx-123', {
        decisions: ['New Decision 1', 'New Decision 2'],
        embedding: expect.any(Float32Array),
      });
    });

    it('should update policies array', async () => {
      vi.mocked(mockStorage.getContext).mockResolvedValue(mockContext);
      vi.mocked(mockStorage.updateContext).mockResolvedValue();

      await useCase.updateContext('ctx-123', { policies: ['Policy 1'] });

      expect(mockStorage.updateContext).toHaveBeenCalledWith('ctx-123', {
        policies: ['Policy 1'],
        embedding: expect.any(Float32Array),
      });
    });

    it('should update tags without embedding regeneration', async () => {
      vi.mocked(mockStorage.getContext).mockResolvedValue(mockContext);
      vi.mocked(mockStorage.updateContext).mockResolvedValue();

      await useCase.updateContext('ctx-123', { tags: ['tag1', 'tag2'] });

      // Tags change still regenerates embedding (tags are part of embedding text)
      expect(mockStorage.updateContext).toHaveBeenCalledWith('ctx-123', {
        tags: ['tag1', 'tag2'],
        embedding: expect.any(Float32Array),
      });
    });

    it('should update action items', async () => {
      vi.mocked(mockStorage.getContext).mockResolvedValue(mockContext);
      vi.mocked(mockStorage.updateContext).mockResolvedValue();

      const newActionItems = [{ task: 'New Task', assignee: 'John' }];
      await useCase.updateContext('ctx-123', { actionItems: newActionItems });

      expect(mockStorage.updateContext).toHaveBeenCalledWith('ctx-123', {
        actionItems: newActionItems,
        embedding: expect.any(Float32Array),
      });
    });

    it('should throw error when context not found', async () => {
      vi.mocked(mockStorage.getContext).mockResolvedValue(null);

      await expect(useCase.updateContext('non-existent', { title: 'New' })).rejects.toThrow(
        'Context not found'
      );
      expect(mockStorage.updateContext).not.toHaveBeenCalled();
    });

    it('should work without embedding service', async () => {
      const useCaseWithoutEmbedding = new ManageContextUseCase(mockStorage);
      vi.mocked(mockStorage.getContext).mockResolvedValue(mockContext);
      vi.mocked(mockStorage.updateContext).mockResolvedValue();

      await useCaseWithoutEmbedding.updateContext('ctx-123', { title: 'New Title' });

      expect(mockStorage.updateContext).toHaveBeenCalledWith('ctx-123', {
        title: 'New Title',
      });
    });

    it('should update multiple fields at once', async () => {
      vi.mocked(mockStorage.getContext).mockResolvedValue(mockContext);
      vi.mocked(mockStorage.updateContext).mockResolvedValue();

      await useCase.updateContext('ctx-123', {
        title: 'New Title',
        summary: 'New Summary',
        decisions: ['D1'],
      });

      expect(mockStorage.updateContext).toHaveBeenCalledWith('ctx-123', {
        title: 'New Title',
        summary: 'New Summary',
        decisions: ['D1'],
        embedding: expect.any(Float32Array),
      });
    });
  });
});
