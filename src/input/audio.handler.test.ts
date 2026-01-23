import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to declare mocks before vi.mock hoisting
const { mockTranscribe, mockValidateFile, mockValidateFilePreflight, mockStatSync, mockSplitWavFile, mockCleanupChunks, mockIsFfmpegAvailable } = vi.hoisted(() => ({
  mockTranscribe: vi.fn(),
  mockValidateFile: vi.fn(),
  mockValidateFilePreflight: vi.fn(),
  mockStatSync: vi.fn(),
  mockSplitWavFile: vi.fn(),
  mockCleanupChunks: vi.fn(),
  mockIsFfmpegAvailable: vi.fn().mockReturnValue(false),
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
  validateFilePreflight: mockValidateFilePreflight,
}));

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal() as object;
  return {
    ...actual,
    statSync: mockStatSync,
  };
});

vi.mock("../utils/audio-split.js", () => ({
  splitWavFile: mockSplitWavFile,
  splitAudioWithFfmpeg: vi.fn(),
  cleanupChunks: mockCleanupChunks,
  isFfmpegAvailable: mockIsFfmpegAvailable,
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
      mockValidateFilePreflight.mockReturnValue({ valid: true, issues: [] });
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/absolute/path/audio.mp3",
      });
      mockStatSync.mockReturnValue({ size: 1024 * 1024 }); // 1MB - small file
      mockTranscribe.mockResolvedValue("Hello, this is a transcription.");

      const result = await handler.handle("./audio.mp3");

      expect(result.type).toBe("audio");
      expect(result.content).toBe("Hello, this is a transcription.");
      expect(mockValidateFile).toHaveBeenCalledWith("./audio.mp3", "audio");
    });

    it("source에 절대 경로 포함", async () => {
      mockValidateFilePreflight.mockReturnValue({ valid: true, issues: [] });
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/Users/test/recordings/meeting.mp3",
      });
      mockStatSync.mockReturnValue({ size: 1024 * 1024 }); // 1MB
      mockTranscribe.mockResolvedValue("Meeting notes...");

      const result = await handler.handle("./meeting.mp3");

      expect(result.source).toContain("meeting.mp3");
    });

    it("파일 검증 실패 시 에러", async () => {
      mockValidateFilePreflight.mockReturnValue({
        valid: false,
        issues: [{ code: "FILE_NOT_FOUND", severity: "error", message: "Audio file not found", solution: "" }],
      });

      await expect(handler.handle("./nonexistent.mp3")).rejects.toThrow();
    });

    it("지원하지 않는 포맷 시 에러", async () => {
      mockValidateFilePreflight.mockReturnValue({ valid: true, issues: [] });
      mockValidateFile.mockReturnValue({
        valid: false,
        absolutePath: "/path/audio.aac",
        error: "Unsupported audio format. Supported: .mp3, .mp4, .mpeg, .mpga, .m4a, .wav, .webm",
      });
      mockStatSync.mockReturnValue({ size: 1024 * 1024 }); // 1MB

      await expect(handler.handle("./audio.aac")).rejects.toThrow(
        "Unsupported audio format"
      );
    });

    it("Whisper API 에러 전파", async () => {
      mockValidateFilePreflight.mockReturnValue({ valid: true, issues: [] });
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/path/audio.mp3",
      });
      mockStatSync.mockReturnValue({ size: 1024 * 1024 }); // 1MB
      mockTranscribe.mockRejectedValue(new Error("Whisper API error"));

      await expect(handler.handle("./audio.mp3")).rejects.toThrow("Whisper API error");
    });

    it("한국어 오디오 처리", async () => {
      mockValidateFilePreflight.mockReturnValue({ valid: true, issues: [] });
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/path/korean.mp3",
      });
      mockStatSync.mockReturnValue({ size: 1024 * 1024 }); // 1MB
      mockTranscribe.mockResolvedValue("안녕하세요. 오늘 회의 내용입니다.");

      const result = await handler.handle("./korean.mp3");

      expect(result.content).toBe("안녕하세요. 오늘 회의 내용입니다.");
    });

    it("대용량 WAV 파일 자동 분할 후 transcribe", async () => {
      mockValidateFilePreflight.mockReturnValue({ valid: true, issues: [] });
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/path/large.wav",
      });
      mockStatSync.mockReturnValue({ size: 100 * 1024 * 1024 }); // 100MB - large file
      mockSplitWavFile.mockResolvedValue(["/tmp/chunk-0.wav", "/tmp/chunk-1.wav", "/tmp/chunk-2.wav"]);
      mockTranscribe
        .mockResolvedValueOnce("Part 1 transcription.")
        .mockResolvedValueOnce("Part 2 transcription.")
        .mockResolvedValueOnce("Part 3 transcription.");

      const result = await handler.handle("./large.wav");

      expect(result.type).toBe("audio");
      expect(result.content).toBe("Part 1 transcription.\n\nPart 2 transcription.\n\nPart 3 transcription.");
      expect(mockSplitWavFile).toHaveBeenCalled();
      expect(mockCleanupChunks).toHaveBeenCalledWith(["/tmp/chunk-0.wav", "/tmp/chunk-1.wav", "/tmp/chunk-2.wav"]);
    });

    it("대용량 파일 분할 후 일부 청크가 빈 경우 무시", async () => {
      mockValidateFilePreflight.mockReturnValue({ valid: true, issues: [] });
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/path/large.wav",
      });
      mockStatSync.mockReturnValue({ size: 50 * 1024 * 1024 }); // 50MB
      mockSplitWavFile.mockResolvedValue(["/tmp/chunk-0.wav", "/tmp/chunk-1.wav"]);
      mockTranscribe
        .mockResolvedValueOnce("Content from chunk 1.")
        .mockResolvedValueOnce("   "); // Empty/whitespace only

      const result = await handler.handle("./large.wav");

      expect(result.content).toBe("Content from chunk 1.");
    });
  });
});
