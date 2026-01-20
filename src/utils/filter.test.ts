import { describe, it, expect } from "vitest";
import { applyFilters, applyProjectSprintFilters } from "./filter.js";
import type { Context } from "../types/context.types.js";

const createContext = (overrides: Partial<Context>): Context => ({
  id: "test-id",
  type: "text",
  content: "test content",
  summary: "test summary",
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("applyFilters", () => {
  const contexts: Context[] = [
    createContext({ id: "1", tags: ["회의", "개발"], type: "text", project: "MCH", sprint: "S1" }),
    createContext({ id: "2", tags: ["회의", "기획"], type: "text", project: "MCH", sprint: "S2" }),
    createContext({ id: "3", tags: ["개발"], type: "image", project: "Other", sprint: "S1" }),
    createContext({ id: "4", tags: ["기획"], type: "audio", project: "MCH" }),
  ];

  it("should return all contexts when no options", () => {
    const result = applyFilters(contexts);
    expect(result).toHaveLength(4);
  });

  it("should return all contexts when options is undefined", () => {
    const result = applyFilters(contexts, undefined);
    expect(result).toHaveLength(4);
  });

  it("should filter by tags", () => {
    const result = applyFilters(contexts, { tags: ["개발"] });
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual(["1", "3"]);
  });

  it("should filter by multiple tags (OR)", () => {
    const result = applyFilters(contexts, { tags: ["회의", "기획"] });
    expect(result).toHaveLength(3);
  });

  it("should filter by type", () => {
    const result = applyFilters(contexts, { type: "text" });
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual(["1", "2"]);
  });

  it("should filter by project", () => {
    const result = applyFilters(contexts, { project: "MCH" });
    expect(result).toHaveLength(3);
    expect(result.map((c) => c.id)).toEqual(["1", "2", "4"]);
  });

  it("should filter by sprint", () => {
    const result = applyFilters(contexts, { sprint: "S1" });
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual(["1", "3"]);
  });

  it("should combine multiple filters (AND)", () => {
    const result = applyFilters(contexts, {
      tags: ["회의"],
      type: "text",
      project: "MCH",
    });
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual(["1", "2"]);
  });

  it("should return empty array when no matches", () => {
    const result = applyFilters(contexts, { project: "NonExistent" });
    expect(result).toHaveLength(0);
  });
});

describe("applyProjectSprintFilters", () => {
  const contexts: Context[] = [
    createContext({ id: "1", project: "MCH", sprint: "S1" }),
    createContext({ id: "2", project: "MCH", sprint: "S2" }),
    createContext({ id: "3", project: "Other", sprint: "S1" }),
  ];

  it("should return all contexts when no options", () => {
    const result = applyProjectSprintFilters(contexts);
    expect(result).toHaveLength(3);
  });

  it("should filter by project only", () => {
    const result = applyProjectSprintFilters(contexts, { project: "MCH" });
    expect(result).toHaveLength(2);
  });

  it("should filter by sprint only", () => {
    const result = applyProjectSprintFilters(contexts, { sprint: "S1" });
    expect(result).toHaveLength(2);
  });

  it("should filter by both project and sprint", () => {
    const result = applyProjectSprintFilters(contexts, { project: "MCH", sprint: "S1" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });
});
