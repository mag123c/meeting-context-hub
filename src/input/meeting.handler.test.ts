import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to declare mocks before vi.mock hoisting
const { mockReadFile, mockValidateFile, mockValidateMeetingFile, mockExistsSync } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
  mockValidateFile: vi.fn(),
  mockValidateMeetingFile: vi.fn(),
  mockExistsSync: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  readFile: mockReadFile,
}));

vi.mock("fs", () => ({
  existsSync: mockExistsSync,
}));

vi.mock("../utils/index.js", () => ({
  validateFile: mockValidateFile,
}));

vi.mock("../utils/preflight/index.js", () => ({
  validateMeetingFile: mockValidateMeetingFile,
  FILE_SIZE_LIMITS: { meeting: 5 * 1024 * 1024 },
}));

import { handleMeetingInput } from "./meeting.handler.js";

describe("handleMeetingInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("파일 입력 처리", () => {
    it(".txt 파일 경로면 파일 읽기", async () => {
      mockValidateMeetingFile.mockReturnValue({ valid: true, issues: [] });
      mockValidateFile.mockReturnValue({ valid: true, absolutePath: "/path/to/meeting.txt" });
      mockReadFile.mockResolvedValue("회의 녹취록 내용입니다.");

      const result = await handleMeetingInput("/path/to/meeting.txt");

      expect(result.transcript).toBe("회의 녹취록 내용입니다.");
      expect(result.source).toContain("meeting.txt");
    });

    it(".md 파일 경로면 파일 읽기", async () => {
      mockValidateMeetingFile.mockReturnValue({ valid: true, issues: [] });
      mockValidateFile.mockReturnValue({ valid: true, absolutePath: "/Users/test/meeting-notes.md" });
      mockReadFile.mockResolvedValue("# 회의록\n\n내용...");

      const result = await handleMeetingInput("./meeting-notes.md");

      expect(result.transcript).toBe("# 회의록\n\n내용...");
      expect(result.source).toContain("meeting-notes.md");
    });

    it("파일 경로일 때 source 포함", async () => {
      mockValidateMeetingFile.mockReturnValue({ valid: true, issues: [] });
      mockValidateFile.mockReturnValue({ valid: true, absolutePath: "/Users/test/docs/notes.txt" });
      mockReadFile.mockResolvedValue("content");

      const result = await handleMeetingInput("/Users/test/docs/notes.txt");

      expect(result.source).toContain("notes.txt");
    });

    it("파일 검증 에러 전파", async () => {
      mockValidateMeetingFile.mockReturnValue({
        valid: false,
        issues: [{ code: "FILE_NOT_FOUND", severity: "error", message: "File not found", solution: "" }],
      });

      await expect(handleMeetingInput("/nonexistent.txt")).rejects.toThrow();
    });
  });

  describe("직접 텍스트 입력 처리", () => {
    it("일반 텍스트면 그대로 반환", async () => {
      const result = await handleMeetingInput("회의 내용 직접 입력");

      expect(result).toEqual({
        transcript: "회의 내용 직접 입력",
      });
      expect(result.source).toBeUndefined();
    });

    it(".txt로 끝나지 않는 텍스트는 직접 텍스트로 처리", async () => {
      const result = await handleMeetingInput("이것은 텍스트입니다");

      expect(result.transcript).toBe("이것은 텍스트입니다");
      expect(mockReadFile).not.toHaveBeenCalled();
    });

    it(".md로 끝나지 않는 텍스트는 직접 텍스트로 처리", async () => {
      const result = await handleMeetingInput("meeting notes here");

      expect(result.transcript).toBe("meeting notes here");
      expect(mockReadFile).not.toHaveBeenCalled();
    });

    it("긴 텍스트 처리", async () => {
      const longText = "회의 내용 ".repeat(1000);

      const result = await handleMeetingInput(longText);

      expect(result.transcript).toBe(longText);
    });

    it("한국어 텍스트 처리", async () => {
      const koreanText = "오늘 회의에서는 프로젝트 진행 상황을 점검했습니다.";

      const result = await handleMeetingInput(koreanText);

      expect(result.transcript).toBe(koreanText);
    });
  });

  describe("엣지 케이스", () => {
    it("빈 텍스트", async () => {
      await expect(handleMeetingInput("")).rejects.toThrow("cannot be empty");
    });

    it("공백만 있는 텍스트", async () => {
      const result = await handleMeetingInput("   ");

      expect(result.transcript).toBe("   ");
    });

    it(".txt 또는 .md를 포함하지만 파일이 아닌 텍스트", async () => {
      // 이 경우는 .txt/.md로 끝나지 않으므로 직접 텍스트로 처리
      const result = await handleMeetingInput("file.txt is a file name");

      expect(result.transcript).toBe("file.txt is a file name");
      expect(mockReadFile).not.toHaveBeenCalled();
    });
  });
});
