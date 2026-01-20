import { describe, it, expect } from "vitest";
import { extractJsonFromMarkdown, parseMetadata, safeJsonParse } from "./json-parser.js";

describe("extractJsonFromMarkdown", () => {
  it("should remove ```json prefix and ``` suffix", () => {
    const input = '```json\n{"key": "value"}\n```';
    expect(extractJsonFromMarkdown(input)).toBe('{"key": "value"}');
  });

  it("should remove ``` prefix and suffix", () => {
    const input = '```\n{"key": "value"}\n```';
    expect(extractJsonFromMarkdown(input)).toBe('{"key": "value"}');
  });

  it("should handle already clean JSON", () => {
    const input = '{"key": "value"}';
    expect(extractJsonFromMarkdown(input)).toBe('{"key": "value"}');
  });

  it("should trim whitespace", () => {
    const input = '  ```json\n{"key": "value"}\n```  ';
    expect(extractJsonFromMarkdown(input)).toBe('{"key": "value"}');
  });
});

describe("parseMetadata", () => {
  it("should parse object format with tags, project, and sprint", () => {
    const input = '{"tags": ["회의", "개발"], "project": "MCH", "sprint": "S1"}';
    const result = parseMetadata(input);
    expect(result).toEqual({
      tags: ["회의", "개발"],
      project: "MCH",
      sprint: "S1",
    });
  });

  it("should parse object format with only tags", () => {
    const input = '{"tags": ["회의", "개발"]}';
    const result = parseMetadata(input);
    expect(result).toEqual({
      tags: ["회의", "개발"],
      project: undefined,
      sprint: undefined,
    });
  });

  it("should parse array format (legacy)", () => {
    const input = '["회의", "개발"]';
    const result = parseMetadata(input);
    expect(result).toEqual({
      tags: ["회의", "개발"],
    });
  });

  it("should handle markdown code blocks", () => {
    const input = '```json\n{"tags": ["회의"], "project": "MCH"}\n```';
    const result = parseMetadata(input);
    expect(result).toEqual({
      tags: ["회의"],
      project: "MCH",
      sprint: undefined,
    });
  });

  it("should filter non-string tags", () => {
    const input = '{"tags": ["valid", 123, null, "also-valid"]}';
    const result = parseMetadata(input);
    expect(result.tags).toEqual(["valid", "also-valid"]);
  });

  it("should treat 'null' string as undefined for project/sprint", () => {
    const input = '{"tags": [], "project": "null", "sprint": "null"}';
    const result = parseMetadata(input);
    expect(result.project).toBeUndefined();
    expect(result.sprint).toBeUndefined();
  });

  it("should return empty tags on parse error", () => {
    const input = "invalid json";
    const result = parseMetadata(input);
    expect(result).toEqual({ tags: [] });
  });

  it("should extract JSON from surrounding text", () => {
    const input = 'Here is the result: {"tags": ["test"], "project": "Demo"} end';
    const result = parseMetadata(input);
    expect(result).toEqual({
      tags: ["test"],
      project: "Demo",
      sprint: undefined,
    });
  });
});

describe("safeJsonParse", () => {
  it("should parse valid JSON", () => {
    const result = safeJsonParse('{"key": "value"}', {});
    expect(result).toEqual({ key: "value" });
  });

  it("should return fallback on invalid JSON", () => {
    const fallback = { default: true };
    const result = safeJsonParse("invalid", fallback);
    expect(result).toEqual(fallback);
  });

  it("should handle markdown code blocks", () => {
    const result = safeJsonParse('```json\n{"key": "value"}\n```', {});
    expect(result).toEqual({ key: "value" });
  });

  it("should return fallback on empty string", () => {
    const fallback = { empty: true };
    const result = safeJsonParse("", fallback);
    expect(result).toEqual(fallback);
  });
});
