import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to declare mocks before vi.mock hoisting
const { mockCreate, mockCreateReadStream } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockCreateReadStream: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class MockOpenAI {
    audio = {
      transcriptions: {
        create: mockCreate,
      },
    };
  },
}));

vi.mock("fs", () => ({
  createReadStream: mockCreateReadStream,
}));

// Now import the module under test
import { WhisperClient } from "./whisper.client.js";

describe("WhisperClient", () => {
  let client: WhisperClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new WhisperClient("test-api-key");
  });

  describe("transcribe", () => {
    it("정상 transcription 반환", async () => {
      const mockStream = { path: "/audio.mp3" };
      mockCreateReadStream.mockReturnValue(mockStream);
      mockCreate.mockResolvedValue({ text: "Hello, this is a test transcription." });

      const result = await client.transcribe("/audio.mp3");

      expect(result).toBe("Hello, this is a test transcription.");
      expect(mockCreateReadStream).toHaveBeenCalledWith("/audio.mp3");
      expect(mockCreate).toHaveBeenCalledWith({
        file: mockStream,
        model: "whisper-1",
        language: "ko",
      });
    });

    it("빈 응답 시 빈 문자열 반환", async () => {
      mockCreateReadStream.mockReturnValue({});
      mockCreate.mockResolvedValue({ text: "" });

      const result = await client.transcribe("/audio.mp3");

      expect(result).toBe("");
    });

    it("API 에러 시 에러 전파", async () => {
      mockCreateReadStream.mockReturnValue({});
      mockCreate.mockRejectedValue(new Error("Invalid audio format"));

      await expect(client.transcribe("/audio.mp3")).rejects.toThrow(
        "Invalid audio format"
      );
    });

    it("파일 스트림 생성 에러 시 에러 전파", async () => {
      mockCreateReadStream.mockImplementation(() => {
        throw new Error("ENOENT: no such file");
      });

      await expect(client.transcribe("/nonexistent.mp3")).rejects.toThrow(
        "ENOENT: no such file"
      );
    });

    it("한국어 언어 설정으로 호출", async () => {
      mockCreateReadStream.mockReturnValue({});
      mockCreate.mockResolvedValue({ text: "한국어 텍스트" });

      await client.transcribe("/korean.mp3");

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          language: "ko",
        })
      );
    });
  });
});
