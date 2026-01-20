import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddContextUseCase } from "./add-context.usecase.js";
import type { ContextRepository } from "../repositories/context.repository.js";
import type { ClaudeClient } from "../ai/clients/claude.client.js";
import type { EmbeddingClient } from "../ai/clients/embedding.client.js";
import type { CreateContextInput } from "../types/context.types.js";

// Mock implementations
const createMockRepository = (): ContextRepository => ({
  save: vi.fn().mockResolvedValue("mock-id"),
  findById: vi.fn().mockResolvedValue(null),
  findByTags: vi.fn().mockResolvedValue([]),
  findSimilar: vi.fn().mockResolvedValue([]),
  findAll: vi.fn().mockResolvedValue([]),
  delete: vi.fn().mockResolvedValue(undefined),
  updateTags: vi.fn().mockResolvedValue(undefined),
  updateEmbedding: vi.fn().mockResolvedValue(undefined),
  getFileNameById: vi.fn().mockResolvedValue(null),
  appendRelatedLinks: vi.fn().mockResolvedValue(undefined),
});

const createMockClaude = (): ClaudeClient => ({
  complete: vi.fn().mockResolvedValue('{"tags": ["test"], "project": "TestProject", "sprint": "S1"}'),
  analyzeImage: vi.fn().mockResolvedValue('{"description": "test image", "tags": ["image"]}'),
}) as unknown as ClaudeClient;

const createMockEmbedding = (): EmbeddingClient => ({
  embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}) as unknown as EmbeddingClient;

describe("AddContextUseCase", () => {
  let useCase: AddContextUseCase;
  let mockRepository: ContextRepository;
  let mockClaude: ClaudeClient;
  let mockEmbedding: EmbeddingClient;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockClaude = createMockClaude();
    mockEmbedding = createMockEmbedding();
    useCase = new AddContextUseCase(mockRepository, mockClaude, mockEmbedding);
  });

  it("should create a context with AI-extracted metadata", async () => {
    const input: CreateContextInput = {
      type: "text",
      content: "테스트 회의 내용입니다.",
    };

    const result = await useCase.execute(input);

    expect(result.type).toBe("text");
    expect(result.content).toBe(input.content);
    expect(result.tags).toEqual(["test"]);
    expect(result.project).toBe("TestProject");
    expect(result.sprint).toBe("S1");
    expect(result.embedding).toEqual([0.1, 0.2, 0.3]);
    expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      type: "text",
      content: input.content,
    }));
  });

  it("should use pre-extracted tags for images", async () => {
    const input: CreateContextInput = {
      type: "image",
      content: "이미지 설명",
      tags: ["이미지태그", "스크린샷"],
    };

    const result = await useCase.execute(input);

    expect(result.tags).toEqual(["이미지태그", "스크린샷"]);
    // Claude.complete should not be called for tagging when tags are provided
    expect(mockClaude.complete).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("이미지 설명")
    );
  });

  it("should prioritize CLI options over AI-extracted metadata", async () => {
    const input: CreateContextInput = {
      type: "text",
      content: "테스트 내용",
      project: "CLIProject",
      sprint: "CLI-S2",
    };

    const result = await useCase.execute(input);

    // CLI options should override AI extraction
    expect(result.project).toBe("CLIProject");
    expect(result.sprint).toBe("CLI-S2");
  });

  it("should call addRelatedLinks after saving", async () => {
    const input: CreateContextInput = {
      type: "text",
      content: "테스트 내용",
    };

    await useCase.execute(input);

    expect(mockRepository.findSimilar).toHaveBeenCalled();
  });

  it("should use content as summary for image type", async () => {
    const input: CreateContextInput = {
      type: "image",
      content: "이미지 설명 요약",
      tags: ["이미지"],
    };

    const result = await useCase.execute(input);

    expect(result.summary).toBe("이미지 설명 요약");
  });

  it("should generate unique IDs for each context", async () => {
    const input1: CreateContextInput = { type: "text", content: "내용 1" };
    const input2: CreateContextInput = { type: "text", content: "내용 2" };

    const result1 = await useCase.execute(input1);
    const result2 = await useCase.execute(input2);

    expect(result1.id).not.toBe(result2.id);
  });
});
