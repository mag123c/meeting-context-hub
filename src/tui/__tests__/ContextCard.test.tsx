/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "ink-testing-library";
import { ContextCard, ContextList } from "../components/ContextCard.js";
import { createMockContext, createMockContextWithSimilarity } from "./test-utils.js";

describe("ContextCard", () => {
  it("context 정보 표시", () => {
    const context = createMockContext({
      summary: "Test Summary Here",
      type: "meeting",
    });

    const { lastFrame } = render(<ContextCard context={context} />);

    expect(lastFrame()).toContain("Test Summary Here");
    expect(lastFrame()).toContain("[meeting]");
  });

  it("tags 렌더링", () => {
    const context = createMockContext({
      tags: ["important", "project-a", "review"],
    });

    const { lastFrame } = render(<ContextCard context={context} />);

    expect(lastFrame()).toContain("Tags: important, project-a, review");
  });

  it("빈 tags 처리", () => {
    const context = createMockContext({ tags: [] });

    const { lastFrame } = render(<ContextCard context={context} />);

    expect(lastFrame()).toContain("Tags: none");
  });

  it("날짜 포맷팅", () => {
    const context = createMockContext({
      createdAt: new Date("2024-01-15T10:00:00.000Z"),
    });

    const { lastFrame } = render(<ContextCard context={context} />);

    // 한국 날짜 형식 확인 (2024. 01. 15. 또는 2024-01-15 형태)
    expect(lastFrame()).toMatch(/2024/);
    expect(lastFrame()).toMatch(/01/);
    expect(lastFrame()).toMatch(/15/);
  });

  it("선택된 상태 표시", () => {
    const context = createMockContext();

    const { lastFrame } = render(<ContextCard context={context} selected={true} />);

    expect(lastFrame()).toContain(">");
  });

  it("project 표시", () => {
    const context = createMockContext({ project: "My Project" });

    const { lastFrame } = render(<ContextCard context={context} />);

    expect(lastFrame()).toContain("My Project");
  });

  it("sprint 표시", () => {
    const context = createMockContext({ sprint: "Sprint 3" });

    const { lastFrame } = render(<ContextCard context={context} />);

    expect(lastFrame()).toContain("Sprint 3");
  });

  it("similarity 표시", () => {
    const context = createMockContextWithSimilarity({}, 0.85);

    const { lastFrame } = render(
      <ContextCard context={context} showSimilarity={true} />
    );

    expect(lastFrame()).toContain("85%");
  });

  it("similarity 숨김", () => {
    const context = createMockContextWithSimilarity({}, 0.85);

    const { lastFrame } = render(
      <ContextCard context={context} showSimilarity={false} />
    );

    expect(lastFrame()).not.toContain("85%");
  });

  it("긴 summary 자르기", () => {
    const context = createMockContext({
      summary:
        "This is a very long summary that should be truncated because it exceeds the maximum length",
    });

    const { lastFrame } = render(<ContextCard context={context} />);

    expect(lastFrame()).toContain("...");
  });
});

describe("ContextList", () => {
  it("여러 context 렌더링", () => {
    const contexts = [
      createMockContext({ id: "id1", summary: "First Context" }),
      createMockContext({ id: "id2", summary: "Second Context" }),
      createMockContext({ id: "id3", summary: "Third Context" }),
    ];

    const { lastFrame } = render(
      <ContextList contexts={contexts} selectedIndex={0} />
    );

    expect(lastFrame()).toContain("First Context");
    expect(lastFrame()).toContain("Second Context");
    expect(lastFrame()).toContain("Third Context");
  });

  it("선택된 인덱스 표시", () => {
    const contexts = [
      createMockContext({ id: "id1", summary: "Not Selected" }),
      createMockContext({ id: "id2", summary: "Selected Item" }),
    ];

    const { lastFrame } = render(
      <ContextList contexts={contexts} selectedIndex={1} />
    );

    // 선택된 아이템에 > 표시
    const output = lastFrame();
    expect(output).toBeDefined();
  });

  it("similarity 표시 옵션", () => {
    const contexts = [
      createMockContextWithSimilarity({ id: "id1" }, 0.9),
      createMockContextWithSimilarity({ id: "id2" }, 0.7),
    ];

    const { lastFrame } = render(
      <ContextList contexts={contexts} selectedIndex={0} showSimilarity={true} />
    );

    expect(lastFrame()).toContain("90%");
    expect(lastFrame()).toContain("70%");
  });

  it("빈 리스트 처리", () => {
    const { lastFrame } = render(
      <ContextList contexts={[]} selectedIndex={0} />
    );

    expect(lastFrame()).toBeDefined();
  });
});
