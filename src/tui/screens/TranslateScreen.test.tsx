import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { TranslateScreen } from './TranslateScreen.js';
import type { TranslateContextUseCase, TranslatePreview } from '../../core/usecases/translate-context.usecase.js';
import type { Context, ExtractedContext } from '../../types/index.js';

describe('TranslateScreen', () => {
  let mockUseCase: TranslateContextUseCase;
  let mockGoBack: ReturnType<typeof vi.fn>;

  const mockContext: Context = {
    id: 'ctx-123',
    projectId: null,
    rawInput: 'Meeting notes',
    title: 'API Design Meeting',
    summary: 'Discussed REST API design patterns',
    decisions: ['Use OpenAPI spec'],
    actionItems: [],
    policies: [],
    openQuestions: [],
    tags: ['api'],
    embedding: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockTranslatedContent: ExtractedContext = {
    title: 'API 설계 미팅',
    summary: 'REST API 설계 패턴에 대해 논의함',
    decisions: ['OpenAPI 스펙 사용'],
    actionItems: [],
    policies: [],
    openQuestions: [],
    tags: ['api'],
  };

  const mockPreview: TranslatePreview = {
    original: mockContext,
    translated: mockTranslatedContent,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGoBack = vi.fn();
    mockUseCase = {
      listContextsForTranslation: vi.fn().mockResolvedValue([mockContext]),
      preview: vi.fn().mockResolvedValue(mockPreview),
      apply: vi.fn().mockResolvedValue(undefined),
    } as unknown as TranslateContextUseCase;
  });

  it('should render loading state initially', () => {
    const { lastFrame } = render(
      <TranslateScreen translateContextUseCase={mockUseCase} goBack={mockGoBack} />
    );
    expect(lastFrame()).toContain('Loading');
  });

  it('should render context list after loading', async () => {
    const { lastFrame } = render(
      <TranslateScreen translateContextUseCase={mockUseCase} goBack={mockGoBack} />
    );

    // Wait for async load
    await vi.waitFor(() => {
      expect(lastFrame()).toContain('API Design Meeting');
    });
  });

  it('should show empty state when no contexts', async () => {
    vi.mocked(mockUseCase.listContextsForTranslation).mockResolvedValue([]);

    const { lastFrame } = render(
      <TranslateScreen translateContextUseCase={mockUseCase} goBack={mockGoBack} />
    );

    await vi.waitFor(() => {
      expect(lastFrame()).toContain('No contexts to translate');
    });
  });

  it('should call goBack on ESC in select-context mode', async () => {
    const { stdin, lastFrame } = render(
      <TranslateScreen translateContextUseCase={mockUseCase} goBack={mockGoBack} />
    );

    await vi.waitFor(() => {
      expect(lastFrame()).toContain('API Design Meeting');
    });

    stdin.write('\u001B'); // ESC key
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('should navigate to select-language mode on Enter', async () => {
    const { stdin, lastFrame } = render(
      <TranslateScreen translateContextUseCase={mockUseCase} goBack={mockGoBack} />
    );

    await vi.waitFor(() => {
      expect(lastFrame()).toContain('API Design Meeting');
    });

    stdin.write('\r'); // Enter key

    await vi.waitFor(() => {
      expect(lastFrame()).toContain('Translate to Korean');
    });
  });

  it('should render with Korean language', async () => {
    const { lastFrame } = render(
      <TranslateScreen
        translateContextUseCase={mockUseCase}
        goBack={mockGoBack}
        language="ko"
      />
    );

    await vi.waitFor(() => {
      expect(lastFrame()).toContain('컨텍스트 번역');
    });
  });

  it('should show translation preview after selecting language', async () => {
    const { stdin, lastFrame } = render(
      <TranslateScreen translateContextUseCase={mockUseCase} goBack={mockGoBack} />
    );

    // Wait for context list
    await vi.waitFor(() => {
      expect(lastFrame()).toContain('API Design Meeting');
    });

    // Select context
    stdin.write('\r');

    // Wait for language selection
    await vi.waitFor(() => {
      expect(lastFrame()).toContain('Translate to Korean');
    });

    // Select Korean
    stdin.write('\r');

    // Wait for preview
    await vi.waitFor(() => {
      expect(lastFrame()).toContain('Translation Preview');
      expect(lastFrame()).toContain('API 설계 미팅');
    });
  });
});
