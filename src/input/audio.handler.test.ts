import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to declare mocks before vi.mock hoisting
const { mockTranscribe, mockValidateFile, mockValidateAudioFile } = vi.hoisted(() => ({
  mockTranscribe: vi.fn(),
  mockValidateFile: vi.fn(),
  mockValidateAudioFile: vi.fn(),
}));

vi.mock("../ai/clients/whisper.client.js", () => ({
  WhisperClient: class MockWhisperClient {
    transcribe = mockTranscribe;
  },
}));

vi.mock("../utils/index.js", () => ({
  validateFile: mockValidateFile,
}));

vi.mock("../utils/preflight/index.js", () => ({
  validateAudioFile: mockValidateAudioFile,
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
      mockValidateAudioFile.mockReturnValue({ valid: true, issues: [] });
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/absolute/path/audio.mp3",
      });
      mockTranscribe.mockResolvedValue("Hello, this is a transcription.");

      const result = await handler.handle("./audio.mp3");

      expect(result.type).toBe("audio");
      expect(result.content).toBe("Hello, this is a transcription.");
      expect(mockValidateFile).toHaveBeenCalledWith("./audio.mp3", "audio");
    });

    it("source에 절대 경로 포함", async () => {
      mockValidateAudioFile.mockReturnValue({ valid: true, issues: [] });
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/Users/test/recordings/meeting.mp3",
      });
      mockTranscribe.mockResolvedValue("Meeting notes...");

      const result = await handler.handle("./meeting.mp3");

      expect(result.source).toContain("meeting.mp3");
    });

    it("파일 검증 실패 시 에러", async () => {
      mockValidateAudioFile.mockReturnValue({
        valid: false,
        issues: [{ code: "FILE_NOT_FOUND", severity: "error", message: "Audio file not found", solution: "" }],
      });

      await expect(handler.handle("./nonexistent.mp3")).rejects.toThrow();
    });

    it("지원하지 않는 포맷 시 에러", async () => {
      mockValidateAudioFile.mockReturnValue({ valid: true, issues: [] });
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
      mockValidateAudioFile.mockReturnValue({ valid: true, issues: [] });
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/path/audio.mp3",
      });
      mockTranscribe.mockRejectedValue(new Error("Whisper API error"));

      await expect(handler.handle("./audio.mp3")).rejects.toThrow("Whisper API error");
    });

    it("한국어 오디오 처리", async () => {
      mockValidateAudioFile.mockReturnValue({ valid: true, issues: [] });
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
