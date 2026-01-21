import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to declare mocks before vi.mock hoisting
const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class MockOpenAI {
    embeddings = {
      create: mockCreate,
    };
  },
}));

// Now import the module under test
import { EmbeddingClient } from "./embedding.client.js";

describe("EmbeddingClient", () => {
  let client: EmbeddingClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new EmbeddingClient("test-api-key");
  });

  describe("embed", () => {
    it("단일 텍스트 임베딩 반환", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];
      mockCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      });

      const result = await client.embed("test text");

      expect(result).toEqual(mockEmbedding);
      expect(mockCreate).toHaveBeenCalledWith({
        model: "text-embedding-3-small",
        input: "test text",
      });
    });

    it("긴 텍스트도 임베딩 가능", async () => {
      const longText = "a".repeat(10000);
      const mockEmbedding = Array(1536).fill(0.1);
      mockCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      });

      const result = await client.embed(longText);

      expect(result).toEqual(mockEmbedding);
      expect(mockCreate).toHaveBeenCalledWith({
        model: "text-embedding-3-small",
        input: longText,
      });
    });

    it("API 에러 시 에러 전파", async () => {
      mockCreate.mockRejectedValue(new Error("Rate limit exceeded"));

      await expect(client.embed("test")).rejects.toThrow("Rate limit exceeded");
    });
  });

  describe("embedBatch", () => {
    it("여러 텍스트 임베딩 배열 반환", async () => {
      const mockEmbeddings = [
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
        [0.7, 0.8, 0.9],
      ];
      mockCreate.mockResolvedValue({
        data: mockEmbeddings.map((embedding) => ({ embedding })),
      });

      const result = await client.embedBatch(["text1", "text2", "text3"]);

      expect(result).toEqual(mockEmbeddings);
      expect(mockCreate).toHaveBeenCalledWith({
        model: "text-embedding-3-small",
        input: ["text1", "text2", "text3"],
      });
    });

    it("단일 텍스트 배열도 처리", async () => {
      mockCreate.mockResolvedValue({
        data: [{ embedding: [0.1, 0.2] }],
      });

      const result = await client.embedBatch(["single text"]);

      expect(result).toEqual([[0.1, 0.2]]);
    });

    it("빈 배열 입력 시 빈 배열 반환", async () => {
      mockCreate.mockResolvedValue({
        data: [],
      });

      const result = await client.embedBatch([]);

      expect(result).toEqual([]);
      expect(mockCreate).toHaveBeenCalledWith({
        model: "text-embedding-3-small",
        input: [],
      });
    });

    it("API 에러 시 에러 전파", async () => {
      mockCreate.mockRejectedValue(new Error("Token limit exceeded"));

      await expect(
        client.embedBatch(["text1", "text2"])
      ).rejects.toThrow("Token limit exceeded");
    });

    it("순서 보장", async () => {
      const mockEmbeddings = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];
      mockCreate.mockResolvedValue({
        data: mockEmbeddings.map((embedding) => ({ embedding })),
      });

      const result = await client.embedBatch(["first", "second", "third"]);

      expect(result[0]).toEqual([1, 0, 0]);
      expect(result[1]).toEqual([0, 1, 0]);
      expect(result[2]).toEqual([0, 0, 1]);
    });
  });
});
