import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchContextUseCase } from "./search-context.usecase.js";
import type { ContextRepository } from "../repositories/context.repository.js";
import type { EmbeddingClient } from "../ai/clients/embedding.client.js";
import type { Context, ContextWithSimilarity } from "../types/context.types.js";

const createContext = (overrides: Partial<Context>): Context => ({
  id: "test-id",
  type: "text",
  content: "test content",
  summary: "test summary",
  tags: [],
  embedding: [0.1, 0.2, 0.3],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockRepository = (): ContextRepository => ({
  save: vi.fn().mockResolvedValue("mock-id"),
  findById: vi.fn(),
  findByTags: vi.fn().mockResolvedValue([]),
  findSimilar: vi.fn().mockResolvedValue([]),
  findAll: vi.fn().mockResolvedValue([]),
  delete: vi.fn().mockResolvedValue(undefined),
  updateTags: vi.fn().mockResolvedValue(undefined),
  updateEmbedding: vi.fn().mockResolvedValue(undefined),
  getFileNameById: vi.fn().mockResolvedValue(null),
  appendRelatedLinks: vi.fn().mockResolvedValue(undefined),
});

const createMockEmbedding = (): EmbeddingClient => ({
  embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}) as unknown as EmbeddingClient;

describe("SearchContextUseCase", () => {
  let useCase: SearchContextUseCase;
  let mockRepository: ContextRepository;
  let mockEmbedding: EmbeddingClient;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockEmbedding = createMockEmbedding();
    useCase = new SearchContextUseCase(mockRepository, mockEmbedding);
  });

  describe("searchByKeyword", () => {
    it("should search in content, summary, and tags", async () => {
      const contexts = [
        createContext({ id: "1", content: "회의록 내용", summary: "요약", tags: ["개발"] }),
        createContext({ id: "2", content: "다른 내용", summary: "회의 요약", tags: ["기획"] }),
        createContext({ id: "3", content: "무관한 내용", summary: "무관", tags: ["회의"] }),
      ];
      vi.mocked(mockRepository.findAll).mockResolvedValue(contexts);

      const result = await useCase.searchByKeyword("회의");

      expect(result.contexts).toHaveLength(3);
    });

    it("should be case-insensitive", async () => {
      const contexts = [
        createContext({ id: "1", content: "Test Content", summary: "요약", tags: [] }),
      ];
      vi.mocked(mockRepository.findAll).mockResolvedValue(contexts);

      const result = await useCase.searchByKeyword("test");

      expect(result.contexts).toHaveLength(1);
    });

    it("should return empty when no matches", async () => {
      const contexts = [
        createContext({ id: "1", content: "내용", summary: "요약", tags: ["태그"] }),
      ];
      vi.mocked(mockRepository.findAll).mockResolvedValue(contexts);

      const result = await useCase.searchByKeyword("없는키워드");

      expect(result.contexts).toHaveLength(0);
    });
  });

  describe("searchByTags", () => {
    it("should filter by tags", async () => {
      const contexts = [
        createContext({ id: "1", tags: ["회의"], project: "MCH" }),
        createContext({ id: "2", tags: ["개발"], project: "MCH" }),
      ];
      vi.mocked(mockRepository.findByTags).mockResolvedValue(contexts);

      const result = await useCase.searchByTags(["회의", "개발"]);

      expect(result.contexts).toHaveLength(2);
    });

    it("should apply project/sprint filters", async () => {
      const contexts = [
        createContext({ id: "1", tags: ["회의"], project: "MCH", sprint: "S1" }),
        createContext({ id: "2", tags: ["회의"], project: "Other", sprint: "S1" }),
      ];
      vi.mocked(mockRepository.findByTags).mockResolvedValue(contexts);

      const result = await useCase.searchByTags(["회의"], { project: "MCH" });

      expect(result.contexts).toHaveLength(1);
      expect(result.contexts[0].id).toBe("1");
    });
  });

  describe("searchSimilar", () => {
    it("should find similar contexts by ID", async () => {
      const baseContext = createContext({ id: "base", embedding: [0.1, 0.2, 0.3] });
      const similarContexts: ContextWithSimilarity[] = [
        { ...createContext({ id: "similar1" }), similarity: 0.9 },
        { ...createContext({ id: "similar2" }), similarity: 0.8 },
      ];

      vi.mocked(mockRepository.findById).mockResolvedValue(baseContext);
      vi.mocked(mockRepository.findSimilar).mockResolvedValue(similarContexts);

      const result = await useCase.searchSimilar("base", 10);

      expect(result.contexts).toHaveLength(2);
    });

    it("should throw error when context not found", async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(useCase.searchSimilar("nonexistent")).rejects.toThrow(
        "Context not found: nonexistent"
      );
    });

    it("should throw error when context has no embedding", async () => {
      const contextWithoutEmbedding = createContext({ id: "no-embed", embedding: [] });
      vi.mocked(mockRepository.findById).mockResolvedValue(contextWithoutEmbedding);

      await expect(useCase.searchSimilar("no-embed")).rejects.toThrow(
        "Context has no embedding: no-embed"
      );
    });

    it("should exclude the source context from results", async () => {
      const baseContext = createContext({ id: "base", embedding: [0.1, 0.2, 0.3] });
      const similarContexts: ContextWithSimilarity[] = [
        { ...createContext({ id: "base" }), similarity: 1.0 },
        { ...createContext({ id: "similar" }), similarity: 0.9 },
      ];

      vi.mocked(mockRepository.findById).mockResolvedValue(baseContext);
      vi.mocked(mockRepository.findSimilar).mockResolvedValue(similarContexts);

      const result = await useCase.searchSimilar("base", 10);

      expect(result.contexts.map((c) => c.id)).not.toContain("base");
    });
  });

  describe("searchByText", () => {
    it("should search by text embedding", async () => {
      const similarContexts: ContextWithSimilarity[] = [
        { ...createContext({ id: "1" }), similarity: 0.95 },
        { ...createContext({ id: "2" }), similarity: 0.85 },
      ];
      vi.mocked(mockRepository.findSimilar).mockResolvedValue(similarContexts);

      const result = await useCase.searchByText("검색 텍스트", 10);

      expect(mockEmbedding.embed).toHaveBeenCalledWith("검색 텍스트");
      expect(result.contexts).toHaveLength(2);
    });

    it("should fetch more when filtering to ensure enough results", async () => {
      const similarContexts: ContextWithSimilarity[] = [
        { ...createContext({ id: "1", project: "MCH" }), similarity: 0.9 },
      ];
      vi.mocked(mockRepository.findSimilar).mockResolvedValue(similarContexts);

      await useCase.searchByText("검색", 10, { project: "MCH" });

      // Should fetch limit * 3 = 30 when filtering
      expect(mockRepository.findSimilar).toHaveBeenCalledWith(expect.any(Array), 30);
    });

    it("should apply project/sprint filters", async () => {
      const similarContexts: ContextWithSimilarity[] = [
        { ...createContext({ id: "1", project: "MCH", sprint: "S1" }), similarity: 0.9 },
        { ...createContext({ id: "2", project: "Other", sprint: "S1" }), similarity: 0.85 },
      ];
      vi.mocked(mockRepository.findSimilar).mockResolvedValue(similarContexts);

      const result = await useCase.searchByText("검색", 10, { project: "MCH" });

      expect(result.contexts).toHaveLength(1);
      expect(result.contexts[0].id).toBe("1");
    });
  });
});
