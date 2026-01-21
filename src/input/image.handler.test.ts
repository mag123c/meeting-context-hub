import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to declare mocks before vi.mock hoisting
const { mockAnalyzeImage, mockValidateFile, mockExtractJsonFromMarkdown, mockSafeJsonParse } = vi.hoisted(() => ({
  mockAnalyzeImage: vi.fn(),
  mockValidateFile: vi.fn(),
  mockExtractJsonFromMarkdown: vi.fn((s: string) => s),
  mockSafeJsonParse: vi.fn(<T>(s: string, d: T) => {
    try {
      return JSON.parse(s) as T;
    } catch {
      return d;
    }
  }),
}));

vi.mock("../ai/clients/claude.client.js", () => ({
  ClaudeClient: class MockClaudeClient {
    analyzeImage = mockAnalyzeImage;
  },
}));

vi.mock("../utils/index.js", () => ({
  validateFile: mockValidateFile,
  extractJsonFromMarkdown: mockExtractJsonFromMarkdown,
  safeJsonParse: mockSafeJsonParse,
}));

import { ImageHandler } from "./image.handler.js";
import { ClaudeClient } from "../ai/clients/claude.client.js";

describe("ImageHandler", () => {
  let handler: ImageHandler;
  let mockClaude: ClaudeClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClaude = new ClaudeClient("test-key");
    handler = new ImageHandler(mockClaude);
  });

  describe("handle", () => {
    it("정상 JSON 응답 파싱", async () => {
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/absolute/path/image.png",
      });
      mockAnalyzeImage.mockResolvedValue(
        JSON.stringify({
          description: "A beautiful sunset",
          tags: ["nature", "sunset", "sky"],
        })
      );

      const result = await handler.handle("./image.png");

      expect(result).toEqual({
        type: "image",
        content: "A beautiful sunset",
        source: "/absolute/path/image.png",
        tags: ["nature", "sunset", "sky"],
      });
      expect(mockValidateFile).toHaveBeenCalledWith("./image.png", "image");
    });

    it("JSON 파싱 실패 시 raw 텍스트로 fallback", async () => {
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/absolute/path/image.png",
      });
      mockAnalyzeImage.mockResolvedValue("This is a plain text description");
      mockSafeJsonParse.mockReturnValue({});

      const result = await handler.handle("./image.png");

      expect(result).toEqual({
        type: "image",
        content: "This is a plain text description",
        source: "/absolute/path/image.png",
        tags: [],
      });
    });

    it("파일 검증 실패 시 에러", async () => {
      mockValidateFile.mockReturnValue({
        valid: false,
        absolutePath: "/nonexistent.png",
        error: "Image file not found: /nonexistent.png",
      });

      await expect(handler.handle("./nonexistent.png")).rejects.toThrow(
        "Image file not found: /nonexistent.png"
      );
    });

    it("source에 절대 경로 포함", async () => {
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/Users/test/images/photo.jpg",
      });
      mockAnalyzeImage.mockResolvedValue(
        JSON.stringify({ description: "A photo", tags: [] })
      );

      const result = await handler.handle("./photo.jpg");

      expect(result.source).toBe("/Users/test/images/photo.jpg");
    });

    it("tags가 배열이 아닌 경우 빈 배열로 처리", async () => {
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/path/image.png",
      });
      mockAnalyzeImage.mockResolvedValue(
        JSON.stringify({ description: "Test", tags: "not-an-array" })
      );
      mockSafeJsonParse.mockReturnValue({ description: "Test", tags: "not-an-array" });

      const result = await handler.handle("./image.png");

      expect(result.tags).toEqual([]);
    });

    it("AI 클라이언트 에러 전파", async () => {
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/path/image.png",
      });
      mockAnalyzeImage.mockRejectedValue(new Error("Claude API error"));

      await expect(handler.handle("./image.png")).rejects.toThrow("Claude API error");
    });
  });
});
