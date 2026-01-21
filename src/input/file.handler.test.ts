import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to declare mocks before vi.mock hoisting
const { mockReadFile, mockValidateFile } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
  mockValidateFile: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  readFile: mockReadFile,
}));

vi.mock("../utils/index.js", () => ({
  validateFile: mockValidateFile,
}));

import { FileHandler } from "./file.handler.js";

describe("FileHandler", () => {
  let handler: FileHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new FileHandler();
  });

  describe("handle", () => {
    it("파일 내용 읽기", async () => {
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/absolute/path/notes.txt",
      });
      mockReadFile.mockResolvedValue("File content here");

      const result = await handler.handle("./notes.txt");

      expect(result).toEqual({
        type: "file",
        content: "File content here",
        source: "/absolute/path/notes.txt",
      });
      expect(mockValidateFile).toHaveBeenCalledWith("./notes.txt", "document");
      expect(mockReadFile).toHaveBeenCalledWith("/absolute/path/notes.txt", "utf-8");
    });

    it("UTF-8 인코딩 처리", async () => {
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/path/korean.txt",
      });
      mockReadFile.mockResolvedValue("한국어 텍스트 파일 내용");

      const result = await handler.handle("./korean.txt");

      expect(result.content).toBe("한국어 텍스트 파일 내용");
      expect(mockReadFile).toHaveBeenCalledWith("/path/korean.txt", "utf-8");
    });

    it("파일 없으면 에러", async () => {
      mockValidateFile.mockReturnValue({
        valid: false,
        absolutePath: "/nonexistent.txt",
        error: "File not found: /nonexistent.txt",
      });

      await expect(handler.handle("./nonexistent.txt")).rejects.toThrow(
        "File not found: /nonexistent.txt"
      );
    });

    it("지원하지 않는 포맷 시 에러", async () => {
      mockValidateFile.mockReturnValue({
        valid: false,
        absolutePath: "/path/file.pdf",
        error: "Unsupported document format. Supported: .txt, .md, .csv, .json",
      });

      await expect(handler.handle("./file.pdf")).rejects.toThrow(
        "Unsupported document format"
      );
    });

    it("source에 절대 경로 포함", async () => {
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/Users/test/docs/readme.md",
      });
      mockReadFile.mockResolvedValue("# README");

      const result = await handler.handle("./readme.md");

      expect(result.source).toBe("/Users/test/docs/readme.md");
    });

    it("markdown 파일 처리", async () => {
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/path/document.md",
      });
      mockReadFile.mockResolvedValue("# Title\n\nContent here");

      const result = await handler.handle("./document.md");

      expect(result.content).toBe("# Title\n\nContent here");
    });

    it("csv 파일 처리", async () => {
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/path/data.csv",
      });
      mockReadFile.mockResolvedValue("name,age\nJohn,30\nJane,25");

      const result = await handler.handle("./data.csv");

      expect(result.content).toBe("name,age\nJohn,30\nJane,25");
    });

    it("json 파일 처리", async () => {
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/path/config.json",
      });
      mockReadFile.mockResolvedValue('{"key": "value"}');

      const result = await handler.handle("./config.json");

      expect(result.content).toBe('{"key": "value"}');
    });

    it("파일 읽기 에러 전파", async () => {
      mockValidateFile.mockReturnValue({
        valid: true,
        absolutePath: "/path/corrupted.txt",
      });
      mockReadFile.mockRejectedValue(new Error("EACCES: permission denied"));

      await expect(handler.handle("./corrupted.txt")).rejects.toThrow(
        "EACCES: permission denied"
      );
    });
  });
});
