import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecordContextUseCase } from './record-context.usecase.js';
import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { ExtractedContext } from '../../types/index.js';
import type { TranscriptionProvider } from '../../adapters/audio/whisper.types.js';
import type { RecordingProvider } from '../../adapters/audio/recording.adapter.js';
import { ExtractService } from '../services/extract.service.js';
import { EmbeddingService } from '../services/embedding.service.js';
import { ChainService } from '../services/chain.service.js';

describe('RecordContextUseCase - Decision integration', () => {
  let useCase: RecordContextUseCase;
  let mockStorage: StorageProvider;
  let mockExtractService: ExtractService;
  let mockEmbeddingService: EmbeddingService;
  let mockChainService: ChainService;
  let mockRecordingProvider: RecordingProvider;
  let mockTranscriptionProvider: TranscriptionProvider;

  const mockExtracted: ExtractedContext = {
    title: 'Recorded Meeting',
    summary: 'Transcription summary',
    decisions: ['Use microservices', 'Deploy on K8s'],
    actionItems: [],
    policies: [],
    openQuestions: [],
    tags: ['recording'],
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

    mockRecordingProvider = {
      start: vi.fn(),
      stop: vi.fn(),
      getState: vi.fn().mockReturnValue('idle'),
      getDuration: vi.fn().mockReturnValue(0),
    } as unknown as RecordingProvider;

    mockTranscriptionProvider = {
      transcribeFile: vi.fn().mockResolvedValue('transcribed text'),
    } as unknown as TranscriptionProvider;

    useCase = new RecordContextUseCase(
      mockRecordingProvider,
      mockTranscriptionProvider,
      mockExtractService,
      mockEmbeddingService,
      mockChainService,
      mockStorage
    );
  });

  it('should create Decision entities after processTranscription', async () => {
    const result = await useCase.processTranscription('transcribed text', 'proj-1');

    expect(result.context.decisions).toEqual(['Use microservices', 'Deploy on K8s']);
    expect(mockStorage.saveDecision).toHaveBeenCalledTimes(2);
    expect(mockStorage.saveDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        contextId: result.context.id,
        content: 'Use microservices',
        projectId: 'proj-1',
        status: 'active',
      })
    );
  });

  it('should not fail if Decision creation throws', async () => {
    vi.mocked(mockStorage.saveDecision).mockRejectedValue(new Error('DB error'));

    const result = await useCase.processTranscription('transcribed text', null);

    // Should still return the context successfully
    expect(result.context).toBeDefined();
    expect(result.context.title).toBe('Recorded Meeting');
  });

  it('should not create decisions when decisions array is empty', async () => {
    vi.mocked(mockExtractService.extract).mockResolvedValue({
      ...mockExtracted,
      decisions: [],
    });

    await useCase.processTranscription('transcribed text', null);

    expect(mockStorage.saveDecision).not.toHaveBeenCalled();
  });
});
