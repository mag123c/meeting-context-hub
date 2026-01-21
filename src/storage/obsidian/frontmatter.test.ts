import { describe, it, expect, vi, beforeEach } from "vitest";
import { contextToMarkdown, markdownToContext, updateFrontmatter } from "./frontmatter.js";
import type { Context } from "../../types/context.types.js";

describe("frontmatter", () => {
  const createTestContext = (overrides: Partial<Context> = {}): Context => ({
    id: "test-uuid-1234",
    type: "text",
    content: "This is the main content",
    summary: "A test context summary",
    tags: ["tag1", "tag2"],
    createdAt: new Date("2024-01-15T10:00:00.000Z"),
    updatedAt: new Date("2024-01-15T10:00:00.000Z"),
    ...overrides,
  });

  describe("contextToMarkdown", () => {
    it("Context → YAML frontmatter + content", () => {
      const context = createTestContext();

      const markdown = contextToMarkdown(context);

      expect(markdown).toContain("---");
      expect(markdown).toContain("id: test-uuid-1234");
      expect(markdown).toContain("type: text");
      expect(markdown).toContain("summary: A test context summary");
      expect(markdown).toContain("tags:");
      expect(markdown).toContain("  - tag1");
      expect(markdown).toContain("  - tag2");
      expect(markdown).toContain("createdAt: '2024-01-15T10:00:00.000Z'");
      expect(markdown).toContain("updatedAt: '2024-01-15T10:00:00.000Z'");
      expect(markdown).toContain("This is the main content");
    });

    it("optional 필드 처리: source", () => {
      const context = createTestContext({ source: "/path/to/file.txt" });

      const markdown = contextToMarkdown(context);

      expect(markdown).toContain("source: /path/to/file.txt");
    });

    it("optional 필드 처리: embedding", () => {
      const context = createTestContext({ embedding: [0.1, 0.2, 0.3] });

      const markdown = contextToMarkdown(context);

      expect(markdown).toContain("embedding:");
    });

    it("optional 필드 처리: project", () => {
      const context = createTestContext({ project: "Test Project" });

      const markdown = contextToMarkdown(context);

      expect(markdown).toContain("project: Test Project");
    });

    it("optional 필드 처리: sprint", () => {
      const context = createTestContext({ sprint: "Sprint 1" });

      const markdown = contextToMarkdown(context);

      expect(markdown).toContain("sprint: Sprint 1");
    });

    it("undefined optional 필드는 제외", () => {
      const context = createTestContext();

      const markdown = contextToMarkdown(context);

      expect(markdown).not.toContain("source:");
      expect(markdown).not.toContain("embedding:");
      expect(markdown).not.toContain("project:");
      expect(markdown).not.toContain("sprint:");
    });

    it("빈 embedding 배열은 제외", () => {
      const context = createTestContext({ embedding: [] });

      const markdown = contextToMarkdown(context);

      expect(markdown).not.toContain("embedding:");
    });

    it("모든 타입 지원", () => {
      const types: Context["type"][] = ["text", "image", "audio", "file", "meeting"];

      types.forEach((type) => {
        const context = createTestContext({ type });
        const markdown = contextToMarkdown(context);
        expect(markdown).toContain(`type: ${type}`);
      });
    });
  });

  describe("markdownToContext", () => {
    it("markdown → Context 객체", () => {
      const markdown = `---
id: test-uuid-1234
type: text
summary: A test summary
tags:
  - tag1
  - tag2
createdAt: '2024-01-15T10:00:00.000Z'
updatedAt: '2024-01-15T10:00:00.000Z'
---

This is the content`;

      const context = markdownToContext(markdown);

      expect(context.id).toBe("test-uuid-1234");
      expect(context.type).toBe("text");
      expect(context.summary).toBe("A test summary");
      expect(context.tags).toEqual(["tag1", "tag2"]);
      expect(context.content).toBe("This is the content");
      expect(context.createdAt).toEqual(new Date("2024-01-15T10:00:00.000Z"));
      expect(context.updatedAt).toEqual(new Date("2024-01-15T10:00:00.000Z"));
    });

    it("optional 필드 파싱: source", () => {
      const markdown = `---
id: test-uuid
type: text
summary: Summary
tags: []
source: /path/to/file.txt
createdAt: '2024-01-15T10:00:00.000Z'
updatedAt: '2024-01-15T10:00:00.000Z'
---

Content`;

      const context = markdownToContext(markdown);

      expect(context.source).toBe("/path/to/file.txt");
    });

    it("optional 필드 파싱: project & sprint", () => {
      const markdown = `---
id: test-uuid
type: text
summary: Summary
tags: []
project: My Project
sprint: Sprint 2
createdAt: '2024-01-15T10:00:00.000Z'
updatedAt: '2024-01-15T10:00:00.000Z'
---

Content`;

      const context = markdownToContext(markdown);

      expect(context.project).toBe("My Project");
      expect(context.sprint).toBe("Sprint 2");
    });

    it("optional 필드 파싱: embedding", () => {
      const markdown = `---
id: test-uuid
type: text
summary: Summary
tags: []
embedding:
  - 0.1
  - 0.2
  - 0.3
createdAt: '2024-01-15T10:00:00.000Z'
updatedAt: '2024-01-15T10:00:00.000Z'
---

Content`;

      const context = markdownToContext(markdown);

      expect(context.embedding).toEqual([0.1, 0.2, 0.3]);
    });

    it("tags 없으면 빈 배열", () => {
      const markdown = `---
id: test-uuid
type: text
summary: Summary
createdAt: '2024-01-15T10:00:00.000Z'
updatedAt: '2024-01-15T10:00:00.000Z'
---

Content`;

      const context = markdownToContext(markdown);

      expect(context.tags).toEqual([]);
    });

    it("content 앞뒤 공백 제거", () => {
      const markdown = `---
id: test-uuid
type: text
summary: Summary
tags: []
createdAt: '2024-01-15T10:00:00.000Z'
updatedAt: '2024-01-15T10:00:00.000Z'
---

   Content with spaces

`;

      const context = markdownToContext(markdown);

      expect(context.content).toBe("Content with spaces");
    });
  });

  describe("updateFrontmatter", () => {
    const sampleMarkdown = `---
id: test-uuid
type: text
summary: Original summary
tags:
  - original
createdAt: '2024-01-15T10:00:00.000Z'
updatedAt: '2024-01-15T10:00:00.000Z'
---

Content here`;

    it("필드 업데이트", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-02-01T12:00:00.000Z"));

      const updated = updateFrontmatter(sampleMarkdown, { tags: ["new", "tags"] });

      expect(updated).toContain("- new");
      expect(updated).toContain("- tags");
      expect(updated).not.toContain("- original");

      vi.useRealTimers();
    });

    it("updatedAt 자동 갱신", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-02-01T12:00:00.000Z"));

      const updated = updateFrontmatter(sampleMarkdown, { tags: ["updated"] });

      expect(updated).toContain("updatedAt: '2024-02-01T12:00:00.000Z'");

      vi.useRealTimers();
    });

    it("embedding 업데이트", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-02-01T12:00:00.000Z"));

      const updated = updateFrontmatter(sampleMarkdown, { embedding: [0.5, 0.6] });

      expect(updated).toContain("embedding:");
      expect(updated).toContain("- 0.5");
      expect(updated).toContain("- 0.6");

      vi.useRealTimers();
    });

    it("기존 필드 유지", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-02-01T12:00:00.000Z"));

      const updated = updateFrontmatter(sampleMarkdown, { tags: ["new"] });

      expect(updated).toContain("id: test-uuid");
      expect(updated).toContain("type: text");
      expect(updated).toContain("summary: Original summary");
      expect(updated).toContain("Content here");

      vi.useRealTimers();
    });
  });

  describe("round-trip conversion", () => {
    it("Context → Markdown → Context 변환 일관성", () => {
      const original = createTestContext({
        source: "/path/file.txt",
        project: "Test Project",
        sprint: "Sprint 1",
        embedding: [0.1, 0.2, 0.3],
      });

      const markdown = contextToMarkdown(original);
      const restored = markdownToContext(markdown);

      expect(restored.id).toBe(original.id);
      expect(restored.type).toBe(original.type);
      expect(restored.summary).toBe(original.summary);
      expect(restored.tags).toEqual(original.tags);
      expect(restored.source).toBe(original.source);
      expect(restored.project).toBe(original.project);
      expect(restored.sprint).toBe(original.sprint);
      expect(restored.embedding).toEqual(original.embedding);
      expect(restored.createdAt.toISOString()).toBe(original.createdAt.toISOString());
      expect(restored.updatedAt.toISOString()).toBe(original.updatedAt.toISOString());
    });
  });
});
