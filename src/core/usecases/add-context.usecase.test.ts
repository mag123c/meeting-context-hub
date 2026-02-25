import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddContextUseCase } from './add-context.usecase.js';
import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { ExtractedContext } from '../../types/index.js';
import { ExtractService } from '../services/extract.service.js';
import { EmbeddingService } from '../services/embedding.service.js';
import { ChainService } from '../services/chain.service.js';

describe('AddContextUseCase - Decision integration', () => {
  let useCase: AddContextUseCase;
  let mockStorage: StorageProvider;
  let mockExtractService: ExtractService;
  let mockEmbeddingService: EmbeddingService;
  let mockChainService: ChainService;

  const mockExtracted: ExtractedContext = {
    title: 'Test Meeting',
    summary: 'Test summary',
    decisions: ['Decision A', 'Decision B'],
    actionItems: [],
    policies: [],
    openQuestions: [],
    tags: ['test'],
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
      listContextsWithEmbeddings: vi.fn().mockResolvedValue([]),
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
      getAllDictionaryMappings: vi.fn().mockResolvedValue(new Map()),
      savePromptContext: vi.fn(),
      getPromptContext: vi.fn(),
      listPromptContexts: vi.fn(),
      listEnabledPromptContexts: vi.fn().mockResolvedValue([]),
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

    mockExtractService = {
      extract: vi.fn().mockResolvedValue(mockExtracted),
    } as unknown as ExtractService;

    mockEmbeddingService = {
      isAvailable: vi.fn().mockReturnValue(false),
      generateForContext: vi.fn(),
      generateForQuery: vi.fn(),
    } as unknown as EmbeddingService;

    mockChainService = {
      findRelated: vi.fn().mockReturnValue([]),
    } as unknown as ChainService;

    useCase = new AddContextUseCase(
      mockExtractService,
      mockEmbeddingService,
      mockChainService,
      mockStorage
    );
  });

  it('should create Decision entities after saving context', async () => {
    const result = await useCase.execute({
      rawInput: 'test input',
      projectId: 'proj-1',
    });

    expect(result.context.decisions).toEqual(['Decision A', 'Decision B']);
    expect(mockStorage.saveDecision).toHaveBeenCalledTimes(2);
    expect(mockStorage.saveDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        contextId: result.context.id,
        content: 'Decision A',
        projectId: 'proj-1',
        status: 'active',
      })
    );
  });

  it('should not create Decision entities when decisions array is empty', async () => {
    vi.mocked(mockExtractService.extract).mockResolvedValue({
      ...mockExtracted,
      decisions: [],
    });

    await useCase.execute({
      rawInput: 'test input',
      projectId: null,
    });

    expect(mockStorage.saveDecision).not.toHaveBeenCalled();
  });

  it('should not fail if Decision creation throws', async () => {
    vi.mocked(mockStorage.saveDecision).mockRejectedValue(new Error('DB error'));

    const result = await useCase.execute({
      rawInput: 'test input',
      projectId: null,
    });

    // Should still return the context successfully
    expect(result.context).toBeDefined();
    expect(result.context.title).toBe('Test Meeting');
  });

  it('should skip empty decision strings', async () => {
    vi.mocked(mockExtractService.extract).mockResolvedValue({
      ...mockExtracted,
      decisions: ['Valid decision', '  ', ''],
    });

    await useCase.execute({
      rawInput: 'test input',
      projectId: null,
    });

    expect(mockStorage.saveDecision).toHaveBeenCalledTimes(1);
    expect(mockStorage.saveDecision).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Valid decision' })
    );
  });
});
