/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "ink-testing-library";
import { Header } from "../components/Header.js";

describe("Header", () => {
  it("title 렌더링", () => {
    const { lastFrame } = render(<Header title="Test Title" />);

    expect(lastFrame()).toContain("Test Title");
  });

  it("breadcrumb 있으면 표시", () => {
    const { lastFrame } = render(
      <Header title="Main" breadcrumb={["Home", "Settings", "Profile"]} />
    );

    expect(lastFrame()).toContain("Home > Settings > Profile");
  });

  it("breadcrumb 없으면 표시 안 함", () => {
    const { lastFrame } = render(<Header title="Simple" />);

    expect(lastFrame()).not.toContain(" > ");
  });

  it("빈 breadcrumb 배열은 표시 안 함", () => {
    const { lastFrame } = render(<Header title="No Breadcrumb" breadcrumb={[]} />);

    expect(lastFrame()).not.toContain(" > ");
  });

  it("구분선 렌더링", () => {
    const { lastFrame } = render(<Header title="With Divider" />);

    expect(lastFrame()).toContain("─");
  });
});
