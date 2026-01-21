import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to declare mocks before vi.mock hoisting
const { mockTranscribe, mockValidateFile } = vi.hoisted(() => ({
  mockTranscribe: vi.fn(),
  mockValidateFile: vi.fn(),
}));

vi.mock("../ai/clients/whisper.client.js", () => ({
  WhisperClient: class MockWhisperClient {
    transcribe = mockTranscribe;
  },
}));

vi.mock("../utils/index.js", () => ({
  validateFile: mockValidateFile,
}));

import { AudioHandler } from "./audio.handler.js";
import { WhisperClient } from "../ai/clients/whisper.client.js";

describe("AudioHandler", () => {
  let handler: AudioHandler;
  let mockWhisper: WhisperClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWhisper = new WhisperClient("test-key");
    handler = new AudioHandler(mockWhisper);
  });

  describe("handle", () => {
    it("Whisper transcription 반환", async () => {
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/absolute/path/audio.mp3",
      });
      mockTranscribe.mockResolvedValue("Hello, this is a transcription.");

      const result = await handler.handle("./audio.mp3");

      expect(result).toEqual({
        type: "audio",
        content: "Hello, this is a transcription.",
        source: "/absolute/path/audio.mp3",
      });
      expect(mockValidateFile).toHaveBeenCalledWith("./audio.mp3", "audio");
      expect(mockTranscribe).toHaveBeenCalledWith("/absolute/path/audio.mp3");
    });

    it("source에 절대 경로 포함", async () => {
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/Users/test/recordings/meeting.mp3",
      });
      mockTranscribe.mockResolvedValue("Meeting notes...");

      const result = await handler.handle("./meeting.mp3");

      expect(result.source).toBe("/Users/test/recordings/meeting.mp3");
    });

    it("파일 검증 실패 시 에러", async () => {
      mockValidateFile.mockReturnValue({
        valid: false,
        absolutePath: "/nonexistent.mp3",
        error: "Audio file not found: /nonexistent.mp3",
      });

      await expect(handler.handle("./nonexistent.mp3")).rejects.toThrow(
        "Audio file not found: /nonexistent.mp3"
      );
    });

    it("지원하지 않는 포맷 시 에러", async () => {
      mockValidateFile.mockReturnValue({
        valid: false,
        absolutePath: "/path/audio.aac",
        error: "Unsupported audio format. Supported: .mp3, .mp4, .mpeg, .mpga, .m4a, .wav, .webm",
      });

      await expect(handler.handle("./audio.aac")).rejects.toThrow(
        "Unsupported audio format"
      );
    });

    it("Whisper API 에러 전파", async () => {
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/path/audio.mp3",
      });
      mockTranscribe.mockRejectedValue(new Error("Whisper API error"));

      await expect(handler.handle("./audio.mp3")).rejects.toThrow("Whisper API error");
    });

    it("한국어 오디오 처리", async () => {
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/path/korean.mp3",
      });
      mockTranscribe.mockResolvedValue("안녕하세요. 오늘 회의 내용입니다.");

      const result = await handler.handle("./korean.mp3");

      expect(result.content).toBe("안녕하세요. 오늘 회의 내용입니다.");
    });
  });
});
