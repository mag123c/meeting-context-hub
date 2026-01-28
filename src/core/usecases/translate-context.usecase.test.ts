import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TranslateContextUseCase, type TranslatePreview } from './translate-context.usecase.js';
import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { AIProvider } from '../../adapters/ai/ai.interface.js';
import type { EmbeddingService } from '../services/embedding.service.js';
import type { Context, ExtractedContext } from '../../types/index.js';

describe('TranslateContextUseCase', () => {
  let useCase: TranslateContextUseCase;
  let mockStorage: StorageProvider;
  let mockAI: AIProvider;
  let mockEmbeddingService: EmbeddingService;

  const mockContext: Context = {
    id: 'ctx-123',
    projectId: 'proj-1',
    rawInput: 'Original meeting notes in English',
    title: 'API Design Meeting',
    summary: 'Discussed REST API design patterns',
    decisions: ['Use OpenAPI spec', 'Follow RESTful conventions'],
    actionItems: [
      { task: 'Create API documentation', assignee: 'Alice' },
      { task: 'Review existing endpoints', dueDate: '2024-02-01' },
    ],
    policies: ['All endpoints must be versioned'],
    openQuestions: ['Should we support GraphQL?'],
    tags: ['api', 'design', 'rest'],
    embedding: new Float32Array([0.1, 0.2, 0.3]),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const translatedContent: ExtractedContext = {
    title: 'API 설계 미팅',
    summary: 'REST API 설계 패턴에 대해 논의함',
    decisions: ['OpenAPI 스펙 사용', 'RESTful 규칙 준수'],
    actionItems: [
      { task: 'API 문서 작성', assignee: 'Alice' },
      { task: '기존 엔드포인트 검토', dueDate: '2024-02-01' },
    ],
    policies: ['모든 엔드포인트는 버전 관리 필수'],
    openQuestions: ['GraphQL을 지원해야 할까요?'],
    tags: ['api', 'design', 'rest'],
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

    mockAI = {
      extract: vi.fn(),
      translate: vi.fn(),
    };

    mockEmbeddingService = {
      isAvailable: vi.fn().mockReturnValue(true),
      generateForContext: vi.fn().mockResolvedValue(new Float32Array([0.4, 0.5, 0.6])),
      generateForQuery: vi.fn(),
    } as unknown as EmbeddingService;

    useCase = new TranslateContextUseCase(mockStorage, mockAI, mockEmbeddingService);
  });

  describe('preview', () => {
    it('should generate translation preview', async () => {
      vi.mocked(mockStorage.getContext).mockResolvedValue(mockContext);
      vi.mocked(mockAI.translate!).mockResolvedValue(translatedContent);

      const result = await useCase.preview('ctx-123', 'ko');

      expect(mockStorage.getContext).toHaveBeenCalledWith('ctx-123');
      expect(mockAI.translate).toHaveBeenCalledWith(
        {
          title: mockContext.title,
          summary: mockContext.summary,
          decisions: mockContext.decisions,
          actionItems: mockContext.actionItems,
          policies: mockContext.policies,
          openQuestions: mockContext.openQuestions,
          tags: mockContext.tags,
        },
        { targetLanguage: 'ko' }
      );
      expect(result.original).toEqual(mockContext);
      expect(result.translated).toEqual(translatedContent);
    });

    it('should throw error when context not found', async () => {
      vi.mocked(mockStorage.getContext).mockResolvedValue(null);

      await expect(useCase.preview('non-existent', 'ko')).rejects.toThrow(
        'Context not found'
      );
      expect(mockAI.translate).not.toHaveBeenCalled();
    });

    it('should throw error when AI provider does not support translate', async () => {
      const aiWithoutTranslate: AIProvider = {
        extract: vi.fn(),
        // No translate method
      };
      const useCaseWithoutTranslate = new TranslateContextUseCase(
        mockStorage,
        aiWithoutTranslate,
        mockEmbeddingService
      );

      vi.mocked(mockStorage.getContext).mockResolvedValue(mockContext);

      await expect(useCaseWithoutTranslate.preview('ctx-123', 'ko')).rejects.toThrow(
        'AI provider does not support translation'
      );
    });
  });

  describe('apply', () => {
    it('should apply translation and update context', async () => {
      vi.mocked(mockStorage.getContext).mockResolvedValue(mockContext);
      vi.mocked(mockStorage.updateContext).mockResolvedValue();

      const preview: TranslatePreview = {
        original: mockContext,
        translated: translatedContent,
      };

      await useCase.apply(preview);

      expect(mockEmbeddingService.generateForContext).toHaveBeenCalled();
      expect(mockStorage.updateContext).toHaveBeenCalledWith('ctx-123', {
        title: translatedContent.title,
        summary: translatedContent.summary,
        decisions: translatedContent.decisions,
        actionItems: translatedContent.actionItems,
        policies: translatedContent.policies,
        openQuestions: translatedContent.openQuestions,
        tags: translatedContent.tags,
        embedding: expect.any(Float32Array),
      });
    });

    it('should apply translation without embedding if service unavailable', async () => {
      const useCaseWithoutEmbedding = new TranslateContextUseCase(
        mockStorage,
        mockAI
      );

      vi.mocked(mockStorage.getContext).mockResolvedValue(mockContext);
      vi.mocked(mockStorage.updateContext).mockResolvedValue();

      const preview: TranslatePreview = {
        original: mockContext,
        translated: translatedContent,
      };

      await useCaseWithoutEmbedding.apply(preview);

      expect(mockStorage.updateContext).toHaveBeenCalledWith('ctx-123', {
        title: translatedContent.title,
        summary: translatedContent.summary,
        decisions: translatedContent.decisions,
        actionItems: translatedContent.actionItems,
        policies: translatedContent.policies,
        openQuestions: translatedContent.openQuestions,
        tags: translatedContent.tags,
      });
    });

    it('should throw error when original context not found during apply', async () => {
      vi.mocked(mockStorage.getContext).mockResolvedValue(null);

      const preview: TranslatePreview = {
        original: mockContext,
        translated: translatedContent,
      };

      await expect(useCase.apply(preview)).rejects.toThrow('Context not found');
      expect(mockStorage.updateContext).not.toHaveBeenCalled();
    });
  });

  describe('listContextsForTranslation', () => {
    it('should list all contexts with pagination', async () => {
      const contexts: Context[] = [mockContext, { ...mockContext, id: 'ctx-456', title: 'Another Meeting' }];
      vi.mocked(mockStorage.listContexts).mockResolvedValue(contexts);

      const result = await useCase.listContextsForTranslation({ limit: 10, offset: 0 });

      expect(mockStorage.listContexts).toHaveBeenCalledWith({ limit: 10, offset: 0 });
      expect(result).toHaveLength(2);
    });
  });
});
