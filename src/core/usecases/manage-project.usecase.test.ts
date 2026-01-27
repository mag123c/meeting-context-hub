import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManageProjectUseCase } from './manage-project.usecase.js';
import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { Project } from '../../types/index.js';

describe('ManageProjectUseCase', () => {
  let mockStorage: StorageProvider;
  let useCase: ManageProjectUseCase;

  const mockProject: Project = {
    id: 'project-1',
    name: 'Test Project',
    description: 'Test description',
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
    useCase = new ManageProjectUseCase(mockStorage);
  });

  describe('updateProject', () => {
    it('should update project name', async () => {
      vi.mocked(mockStorage.getProject).mockResolvedValue(mockProject);
      vi.mocked(mockStorage.getProjectByName).mockResolvedValue(null);
      vi.mocked(mockStorage.updateProject).mockResolvedValue();

      const result = await useCase.updateProject('project-1', { name: 'New Name' });

      expect(mockStorage.updateProject).toHaveBeenCalledWith('project-1', { name: 'New Name' });
      expect(result.name).toBe('New Name');
    });

    it('should update project description', async () => {
      vi.mocked(mockStorage.getProject).mockResolvedValue(mockProject);
      vi.mocked(mockStorage.updateProject).mockResolvedValue();

      const result = await useCase.updateProject('project-1', { description: 'New description' });

      expect(mockStorage.updateProject).toHaveBeenCalledWith('project-1', { description: 'New description' });
      expect(result.description).toBe('New description');
    });

    it('should throw error if project not found', async () => {
      vi.mocked(mockStorage.getProject).mockResolvedValue(null);

      await expect(useCase.updateProject('non-existent', { name: 'New Name' }))
        .rejects.toThrow('Project not found');
    });

    it('should throw error if name is empty', async () => {
      vi.mocked(mockStorage.getProject).mockResolvedValue(mockProject);

      await expect(useCase.updateProject('project-1', { name: '' }))
        .rejects.toThrow('Project name cannot be empty');
    });

    it('should throw error if name is whitespace only', async () => {
      vi.mocked(mockStorage.getProject).mockResolvedValue(mockProject);

      await expect(useCase.updateProject('project-1', { name: '   ' }))
        .rejects.toThrow('Project name cannot be empty');
    });

    it('should throw error if new name already exists', async () => {
      const existingProject: Project = {
        id: 'project-2',
        name: 'Existing Project',
        description: null,
        createdAt: new Date(),
      };
      vi.mocked(mockStorage.getProject).mockResolvedValue(mockProject);
      vi.mocked(mockStorage.getProjectByName).mockResolvedValue(existingProject);

      await expect(useCase.updateProject('project-1', { name: 'Existing Project' }))
        .rejects.toThrow('Project "Existing Project" already exists');
    });

    it('should allow keeping the same name', async () => {
      vi.mocked(mockStorage.getProject).mockResolvedValue(mockProject);
      vi.mocked(mockStorage.getProjectByName).mockResolvedValue(mockProject); // same project
      vi.mocked(mockStorage.updateProject).mockResolvedValue();

      const result = await useCase.updateProject('project-1', { name: 'Test Project' });

      expect(mockStorage.updateProject).toHaveBeenCalled();
      expect(result.name).toBe('Test Project');
    });
  });
});
