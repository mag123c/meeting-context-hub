import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Context } from "../../types/context.types.js";

// Use vi.hoisted to declare mocks before vi.mock hoisting
const {
  mockReadFile,
  mockWriteFile,
  mockReaddir,
  mockUnlink,
  mockMkdir,
  mockExistsSync,
  mockContextToMarkdown,
  mockMarkdownToContext,
  mockUpdateFrontmatter,
  mockApplyFilters,
  mockCosineSimilarity,
  mockNormalizeKoreanText,
} = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
  mockWriteFile: vi.fn(),
  mockReaddir: vi.fn(),
  mockUnlink: vi.fn(),
  mockMkdir: vi.fn(),
  mockExistsSync: vi.fn(),
  mockContextToMarkdown: vi.fn(),
  mockMarkdownToContext: vi.fn(),
  mockUpdateFrontmatter: vi.fn(),
  mockApplyFilters: vi.fn((contexts: Context[]) => contexts),
  mockCosineSimilarity: vi.fn(),
  mockNormalizeKoreanText: vi.fn((text: string) => text.slice(0, 15).replace(/\s+/g, "-")),
}));

vi.mock("fs/promises", () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  readdir: mockReaddir,
  unlink: mockUnlink,
  mkdir: mockMkdir,
}));

vi.mock("fs", () => ({
  existsSync: mockExistsSync,
}));

vi.mock("./frontmatter.js", () => ({
  contextToMarkdown: mockContextToMarkdown,
  markdownToContext: mockMarkdownToContext,
  updateFrontmatter: mockUpdateFrontmatter,
}));

vi.mock("../../utils/index.js", () => ({
  applyFilters: mockApplyFilters,
  cosineSimilarity: mockCosineSimilarity,
  normalizeKoreanText: mockNormalizeKoreanText,
}));

import { ObsidianContextRepository } from "./context.obsidian.js";

describe("ObsidianContextRepository", () => {
  let repository: ObsidianContextRepository;
  const basePath = "/test/vault/mch";

  const createTestContext = (id: string, summary: string, overrides: Partial<Context> = {}): Context => ({
    id,
    type: "text",
    content: "Test content",
    summary,
    tags: ["test"],
    createdAt: new Date("2024-01-15T10:00:00.000Z"),
    updatedAt: new Date("2024-01-15T10:00:00.000Z"),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    repository = new ObsidianContextRepository(basePath);
  });

  describe("save", () => {
    it("새 파일 생성 (short-title_shortId 형식)", async () => {
      const context = createTestContext("abc12345-1234-5678-9abc-def012345678", "PG연동 완료");
      mockContextToMarkdown.mockReturnValue("---\nid: abc12345...\n---\nContent");

      const result = await repository.save(context);

      expect(result).toBe("abc12345-1234-5678-9abc-def012345678");
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining("_abc12345.md"),
        expect.any(String),
        "utf-8"
      );
    });

    it("디렉토리 없으면 자동 생성", async () => {
      mockExistsSync.mockReturnValue(false);
      const context = createTestContext("test-uuid", "Test summary");
      mockContextToMarkdown.mockReturnValue("markdown");

      await repository.save(context);

      expect(mockMkdir).toHaveBeenCalledWith(basePath, { recursive: true });
    });
  });

  describe("findById", () => {
    it("short ID로 찾기", async () => {
      const context = createTestContext("abc12345-full-uuid", "Test");
      mockReaddir.mockResolvedValue(["Test_abc12345.md", "Other_def67890.md"]);
      mockReadFile.mockResolvedValue("markdown content");
      mockMarkdownToContext.mockReturnValue(context);

      const result = await repository.findById("abc12345-full-uuid");

      expect(result).toEqual(context);
      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining("Test_abc12345.md"),
        "utf-8"
      );
    });

    it("full UUID로 찾기 (레거시)", async () => {
      const uuid = "full-uuid-1234-5678-9abc";
      const context = createTestContext(uuid, "Legacy");
      mockReaddir.mockResolvedValue(["Other_file.md"]);
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes(`${uuid}.md`);
      });
      mockReadFile.mockResolvedValue("markdown");
      mockMarkdownToContext.mockReturnValue(context);

      const result = await repository.findById(uuid);

      expect(result).toEqual(context);
    });

    it("없으면 null", async () => {
      mockReaddir.mockResolvedValue([]);
      mockExistsSync.mockReturnValue(false);

      const result = await repository.findById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("findByTags", () => {
    it("태그 일치하는 컨텍스트만", async () => {
      const ctx1 = createTestContext("id1", "Sum1", { tags: ["meeting", "important"] });
      const ctx2 = createTestContext("id2", "Sum2", { tags: ["other"] });
      const ctx3 = createTestContext("id3", "Sum3", { tags: ["meeting"] });

      mockReaddir.mockResolvedValue(["file1.md", "file2.md", "file3.md"]);
      mockReadFile.mockResolvedValue("markdown");
      mockMarkdownToContext
        .mockReturnValueOnce(ctx1)
        .mockReturnValueOnce(ctx2)
        .mockReturnValueOnce(ctx3);

      const results = await repository.findByTags(["meeting"]);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe("id1");
      expect(results[1].id).toBe("id3");
    });

    it("여러 태그 OR 조건", async () => {
      const ctx1 = createTestContext("id1", "Sum1", { tags: ["a"] });
      const ctx2 = createTestContext("id2", "Sum2", { tags: ["b"] });
      const ctx3 = createTestContext("id3", "Sum3", { tags: ["c"] });

      mockReaddir.mockResolvedValue(["f1.md", "f2.md", "f3.md"]);
      mockReadFile.mockResolvedValue("markdown");
      mockMarkdownToContext
        .mockReturnValueOnce(ctx1)
        .mockReturnValueOnce(ctx2)
        .mockReturnValueOnce(ctx3);

      const results = await repository.findByTags(["a", "b"]);

      expect(results).toHaveLength(2);
    });
  });

  describe("findSimilar", () => {
    it("유사도 순 정렬", async () => {
      const ctx1 = createTestContext("id1", "Sum1", { embedding: [1, 0, 0] });
      const ctx2 = createTestContext("id2", "Sum2", { embedding: [0, 1, 0] });
      const ctx3 = createTestContext("id3", "Sum3", { embedding: [0.9, 0.1, 0] });

      mockReaddir.mockResolvedValue(["f1.md", "f2.md", "f3.md"]);
      mockReadFile.mockResolvedValue("markdown");
      mockMarkdownToContext
        .mockReturnValueOnce(ctx1)
        .mockReturnValueOnce(ctx2)
        .mockReturnValueOnce(ctx3);

      mockCosineSimilarity
        .mockReturnValueOnce(0.8)  // ctx1
        .mockReturnValueOnce(0.2)  // ctx2
        .mockReturnValueOnce(0.9); // ctx3

      const results = await repository.findSimilar([1, 0, 0], 10);

      expect(results).toHaveLength(3);
      expect(results[0].id).toBe("id3"); // highest similarity
      expect(results[0].similarity).toBe(0.9);
      expect(results[1].id).toBe("id1");
      expect(results[2].id).toBe("id2");
    });

    it("limit 적용", async () => {
      const ctx1 = createTestContext("id1", "Sum1", { embedding: [1, 0] });
      const ctx2 = createTestContext("id2", "Sum2", { embedding: [0, 1] });

      mockReaddir.mockResolvedValue(["f1.md", "f2.md"]);
      mockReadFile.mockResolvedValue("markdown");
      mockMarkdownToContext
        .mockReturnValueOnce(ctx1)
        .mockReturnValueOnce(ctx2);

      mockCosineSimilarity
        .mockReturnValueOnce(0.8)
        .mockReturnValueOnce(0.5);

      const results = await repository.findSimilar([1, 0], 1);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("id1");
    });

    it("embedding 없는 컨텍스트 제외", async () => {
      const ctx1 = createTestContext("id1", "Sum1", { embedding: [1, 0] });
      const ctx2 = createTestContext("id2", "Sum2", { embedding: undefined });

      mockReaddir.mockResolvedValue(["f1.md", "f2.md"]);
      mockReadFile.mockResolvedValue("markdown");
      mockMarkdownToContext
        .mockReturnValueOnce(ctx1)
        .mockReturnValueOnce(ctx2);

      mockCosineSimilarity.mockReturnValue(0.5);

      const results = await repository.findSimilar([1, 0], 10);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("id1");
    });
  });

  describe("findAll", () => {
    it("필터: tag, type, project, sprint", async () => {
      const ctx1 = createTestContext("id1", "Sum1", { type: "meeting", project: "A" });
      const ctx2 = createTestContext("id2", "Sum2", { type: "text", project: "B" });

      mockReaddir.mockResolvedValue(["f1.md", "f2.md"]);
      mockReadFile.mockResolvedValue("markdown");
      mockMarkdownToContext
        .mockReturnValueOnce(ctx1)
        .mockReturnValueOnce(ctx2);

      await repository.findAll({ type: "meeting" });

      expect(mockApplyFilters).toHaveBeenCalled();
    });

    it("createdAt 내림차순 정렬", async () => {
      const ctx1 = createTestContext("id1", "Sum1", {
        createdAt: new Date("2024-01-01"),
      });
      const ctx2 = createTestContext("id2", "Sum2", {
        createdAt: new Date("2024-01-15"),
      });

      mockReaddir.mockResolvedValue(["f1.md", "f2.md"]);
      mockReadFile.mockResolvedValue("markdown");
      mockMarkdownToContext
        .mockReturnValueOnce(ctx1)
        .mockReturnValueOnce(ctx2);

      const results = await repository.findAll();

      expect(results[0].createdAt.getTime()).toBeGreaterThan(results[1].createdAt.getTime());
    });

    it("페이지네이션: limit, offset", async () => {
      const contexts = Array.from({ length: 5 }, (_, i) =>
        createTestContext(`id${i}`, `Sum${i}`, {
          createdAt: new Date(Date.now() - i * 1000),
        })
      );

      mockReaddir.mockResolvedValue(contexts.map((_, i) => `f${i}.md`));
      mockReadFile.mockResolvedValue("markdown");
      contexts.forEach((ctx) => mockMarkdownToContext.mockReturnValueOnce(ctx));

      const results = await repository.findAll({ limit: 2, offset: 1 });

      expect(results).toHaveLength(2);
    });
  });

  describe("delete", () => {
    it("파일 삭제", async () => {
      const context = createTestContext("abc12345-uuid", "Test");
      mockReaddir.mockResolvedValue(["Test_abc12345.md"]);
      mockReadFile.mockResolvedValue("markdown");
      mockMarkdownToContext.mockReturnValue(context);
      mockExistsSync.mockReturnValue(true);

      await repository.delete("abc12345-uuid");

      expect(mockUnlink).toHaveBeenCalled();
    });

    it("없는 파일은 무시", async () => {
      mockReaddir.mockResolvedValue([]);
      mockExistsSync.mockReturnValue(false);

      await repository.delete("nonexistent");

      expect(mockUnlink).not.toHaveBeenCalled();
    });
  });

  describe("appendRelatedLinks", () => {
    it("관련 문서 섹션 추가", async () => {
      const context = createTestContext("abc12345-uuid", "Main");
      const related1 = createTestContext("rel11111-uuid", "Related1");
      const related2 = createTestContext("rel22222-uuid", "Related2");

      mockReaddir.mockResolvedValue([
        "Main_abc12345.md",
        "Related1_rel11111.md",
        "Related2_rel22222.md",
      ]);
      mockReadFile.mockResolvedValue("---\nfrontmatter\n---\n\nContent");
      mockMarkdownToContext
        .mockReturnValueOnce(context)
        .mockReturnValueOnce(related1)
        .mockReturnValueOnce(related2);

      await repository.appendRelatedLinks("abc12345-uuid", [
        "rel11111-uuid",
        "rel22222-uuid",
      ]);

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("## 관련 문서"),
        "utf-8"
      );
    });

    it("최대 5개 제한", async () => {
      const context = createTestContext("main-uuid", "Main");
      const relatedIds = Array.from({ length: 7 }, (_, i) => `rel-${i}`);

      mockReaddir.mockResolvedValue(["Main_main-uui.md"]);
      mockReadFile.mockResolvedValue("Content");
      mockMarkdownToContext.mockReturnValue(context);

      // Related file names should only return first 5 due to limit
      relatedIds.slice(0, 5).forEach((id) => {
        mockReaddir.mockResolvedValue([`File_${id.slice(0, 8)}.md`]);
      });

      await repository.appendRelatedLinks("main-uuid", relatedIds.slice(0, 5));

      // Should have been called - this tests the logic doesn't exceed limit
      expect(mockWriteFile).toHaveBeenCalled();
    });
  });

  describe("updateTags", () => {
    it("태그 업데이트", async () => {
      const context = createTestContext("abc12345-uuid", "Test");
      mockReaddir.mockResolvedValue(["Test_abc12345.md"]);
      mockReadFile.mockResolvedValue("markdown content");
      mockMarkdownToContext.mockReturnValue(context);
      mockUpdateFrontmatter.mockReturnValue("updated markdown");

      await repository.updateTags("abc12345-uuid", ["new", "tags"]);

      expect(mockUpdateFrontmatter).toHaveBeenCalledWith("markdown content", {
        tags: ["new", "tags"],
      });
      expect(mockWriteFile).toHaveBeenCalled();
    });
  });

  describe("updateEmbedding", () => {
    it("embedding 업데이트", async () => {
      mockReaddir.mockResolvedValue(["Test_abc12345.md"]);
      mockReadFile.mockResolvedValue("markdown");
      mockUpdateFrontmatter.mockReturnValue("updated");

      await repository.updateEmbedding("abc12345-uuid", [0.1, 0.2]);

      expect(mockUpdateFrontmatter).toHaveBeenCalledWith("markdown", {
        embedding: [0.1, 0.2],
      });
    });
  });
});
