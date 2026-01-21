/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "ink-testing-library";
import { ErrorBanner } from "../components/ErrorBanner.js";

describe("ErrorBanner", () => {
  it("에러 메시지 표시", () => {
    const { lastFrame } = render(<ErrorBanner message="Something went wrong" />);

    expect(lastFrame()).toContain("Error: Something went wrong");
  });

  it("긴 에러 메시지 처리", () => {
    const longMessage =
      "This is a very long error message that describes exactly what went wrong in great detail";
    const { lastFrame } = render(<ErrorBanner message={longMessage} />);

    expect(lastFrame()).toContain(longMessage);
  });

  it("한국어 에러 메시지", () => {
    const { lastFrame } = render(<ErrorBanner message="파일을 찾을 수 없습니다" />);

    expect(lastFrame()).toContain("Error: 파일을 찾을 수 없습니다");
  });

  it("빈 메시지", () => {
    const { lastFrame } = render(<ErrorBanner message="" />);

    expect(lastFrame()).toContain("Error:");
  });
});
