import { vi } from "vitest";
import type { Context, ContextWithSimilarity } from "../../types/context.types.js";
import type { AppServices } from "../../core/factories.js";

/**
 * 테스트용 Context 생성
 */
export function createMockContext(overrides: Partial<Context> = {}): Context {
  return {
    id: "test-uuid-1234-5678",
    type: "text",
    content: "Test content here",
    summary: "Test context summary",
    tags: ["test", "mock"],
    createdAt: new Date("2024-01-15T10:00:00.000Z"),
    updatedAt: new Date("2024-01-15T10:00:00.000Z"),
    ...overrides,
  };
}

/**
 * 테스트용 ContextWithSimilarity 생성
 */
export function createMockContextWithSimilarity(
  overrides: Partial<Context> = {},
  similarity = 0.85
): ContextWithSimilarity {
  return {
    ...createMockContext(overrides),
    similarity,
  };
}

/**
 * 테스트용 Navigation Context 생성
 */
export function createMockNavigation() {
  return {
    screen: "main" as const,
    navigate: vi.fn(),
    goBack: vi.fn(),
    currentScreen: "main" as const,
    params: undefined,
  };
}

/**
 * 테스트용 Repository Mock 생성
 */
export function createMockRepository() {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByTags: vi.fn(),
    findSimilar: vi.fn(),
    findAll: vi.fn(),
    delete: vi.fn(),
    updateTags: vi.fn(),
    updateEmbedding: vi.fn(),
    getFileNameById: vi.fn(),
    appendRelatedLinks: vi.fn(),
  };
}

/**
 * 테스트용 AppServices Mock 생성
 */
export function createMockServices(): AppServices {
  return {
    config: {
      anthropicApiKey: "test-anthropic-key",
      openaiApiKey: "test-openai-key",
      obsidianVaultPath: "/test/vault",
      mchFolder: "mch",
    },
    repository: createMockRepository() as unknown as AppServices["repository"],
    claude: {
      complete: vi.fn(),
      analyzeImage: vi.fn(),
    } as unknown as AppServices["claude"],
    whisper: {
      transcribe: vi.fn(),
    } as unknown as AppServices["whisper"],
    embedding: {
      embed: vi.fn(),
      embedBatch: vi.fn(),
    } as unknown as AppServices["embedding"],
    textHandler: {
      handle: vi.fn(),
    } as unknown as AppServices["textHandler"],
    imageHandler: {
      handle: vi.fn(),
    } as unknown as AppServices["imageHandler"],
    audioHandler: {
      handle: vi.fn(),
    } as unknown as AppServices["audioHandler"],
    fileHandler: {
      handle: vi.fn(),
    } as unknown as AppServices["fileHandler"],
    addContextUseCase: {
      execute: vi.fn(),
    } as unknown as AppServices["addContextUseCase"],
    searchContextUseCase: {
      executeSemanticSearch: vi.fn(),
      executeExactSearch: vi.fn(),
      executeSimilarSearch: vi.fn(),
    } as unknown as AppServices["searchContextUseCase"],
    summarizeMeetingUseCase: {
      execute: vi.fn(),
    } as unknown as AppServices["summarizeMeetingUseCase"],
  };
}
