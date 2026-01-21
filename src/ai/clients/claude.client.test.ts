import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Prompt } from "../../types/prompt.types.js";

// Use vi.hoisted to declare mocks before vi.mock hoisting
const { mockCreate, mockReadFile } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockReadFile: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = {
      create: mockCreate,
    };
  },
}));

vi.mock("fs/promises", () => ({
  readFile: mockReadFile,
}));

// Now import the module under test
import { ClaudeClient } from "./claude.client.js";

describe("ClaudeClient", () => {
  let client: ClaudeClient;

  const testPrompt: Prompt = {
    version: "1.0",
    system: "You are a helpful assistant.",
    template: (input: string) => `Process this: ${input}`,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    client = new ClaudeClient("test-api-key");
  });

  describe("complete", () => {
    it("정상 응답 시 텍스트 반환", async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: "Hello, world!" }],
      });

      const result = await client.complete(testPrompt, "test input");

      expect(result).toBe("Hello, world!");
      expect(mockCreate).toHaveBeenCalledWith({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: testPrompt.system,
        messages: [{ role: "user", content: "Process this: test input" }],
      });
    });

    it("text 블록 없으면 Error throw", async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: "tool_use", id: "1", name: "test", input: {} }],
      });

      await expect(client.complete(testPrompt, "test")).rejects.toThrow();
    });

    it("빈 content 배열이면 Error throw", async () => {
      mockCreate.mockResolvedValue({
        content: [],
      });

      await expect(client.complete(testPrompt, "test")).rejects.toThrow();
    });

    it("API 에러 시 에러 전파", async () => {
      // Use non-retryable error (4xx status, not 429)
      const error = new Error("Invalid request");
      (error as { status?: number }).status = 400;
      mockCreate.mockRejectedValue(error);

      await expect(client.complete(testPrompt, "test")).rejects.toThrow();
    });
  });

  describe("analyzeImage", () => {
    it("이미지 파일 base64 인코딩 후 전송", async () => {
      const imageBuffer = Buffer.from("fake image data");
      mockReadFile.mockResolvedValue(imageBuffer);
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: "Image analysis result" }],
      });

      const result = await client.analyzeImage(testPrompt, "/path/to/image.png");

      expect(result).toBe("Image analysis result");
      expect(mockReadFile).toHaveBeenCalledWith("/path/to/image.png");
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/png",
                    data: imageBuffer.toString("base64"),
                  },
                },
                { type: "text", text: "Process this: " },
              ],
            },
          ],
        })
      );
    });

    it("파일 읽기 실패 시 에러 전파", async () => {
      mockReadFile.mockRejectedValue(new Error("ENOENT: no such file"));

      await expect(
        client.analyzeImage(testPrompt, "/nonexistent.png")
      ).rejects.toThrow("ENOENT: no such file");
    });

    it("지원 포맷: jpeg", async () => {
      mockReadFile.mockResolvedValue(Buffer.from("jpeg data"));
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: "Result" }],
      });

      await client.analyzeImage(testPrompt, "/image.jpeg");

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({
                  source: expect.objectContaining({
                    media_type: "image/jpeg",
                  }),
                }),
              ]),
            }),
          ],
        })
      );
    });

    it("지원 포맷: jpg", async () => {
      mockReadFile.mockResolvedValue(Buffer.from("jpg data"));
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: "Result" }],
      });

      await client.analyzeImage(testPrompt, "/image.jpg");

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({
                  source: expect.objectContaining({
                    media_type: "image/jpeg",
                  }),
                }),
              ]),
            }),
          ],
        })
      );
    });

    it("지원 포맷: gif", async () => {
      mockReadFile.mockResolvedValue(Buffer.from("gif data"));
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: "Result" }],
      });

      await client.analyzeImage(testPrompt, "/image.gif");

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({
                  source: expect.objectContaining({
                    media_type: "image/gif",
                  }),
                }),
              ]),
            }),
          ],
        })
      );
    });

    it("지원 포맷: webp", async () => {
      mockReadFile.mockResolvedValue(Buffer.from("webp data"));
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: "Result" }],
      });

      await client.analyzeImage(testPrompt, "/image.webp");

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({
                  source: expect.objectContaining({
                    media_type: "image/webp",
                  }),
                }),
              ]),
            }),
          ],
        })
      );
    });

    it("알 수 없는 포맷은 png로 기본 처리", async () => {
      mockReadFile.mockResolvedValue(Buffer.from("unknown data"));
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: "Result" }],
      });

      await client.analyzeImage(testPrompt, "/image.unknown");

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({
                  source: expect.objectContaining({
                    media_type: "image/png",
                  }),
                }),
              ]),
            }),
          ],
        })
      );
    });

    it("text 블록 없으면 Error throw", async () => {
      mockReadFile.mockResolvedValue(Buffer.from("image"));
      mockCreate.mockResolvedValue({
        content: [],
      });

      await expect(
        client.analyzeImage(testPrompt, "/image.png")
      ).rejects.toThrow();
    });
  });
});
