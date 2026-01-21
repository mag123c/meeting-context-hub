/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNavigation } from "./useNavigation.js";

describe("useNavigation", () => {
  it("초기 화면은 main (기본값)", () => {
    const { result } = renderHook(() => useNavigation());

    expect(result.current.screen).toBe("main");
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.params).toBeUndefined();
  });

  it("초기 화면 지정 가능", () => {
    const { result } = renderHook(() => useNavigation("search"));

    expect(result.current.screen).toBe("search");
    expect(result.current.canGoBack).toBe(false);
  });

  it("navigate 호출 시 화면 전환 + history 추가", () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.navigate("add");
    });

    expect(result.current.screen).toBe("add");
    expect(result.current.canGoBack).toBe(true);
  });

  it("goBack 호출 시 이전 화면으로", () => {
    const { result } = renderHook(() => useNavigation());

    // Navigate to add, then to search
    act(() => {
      result.current.navigate("add");
    });
    act(() => {
      result.current.navigate("search");
    });

    expect(result.current.screen).toBe("search");
    expect(result.current.canGoBack).toBe(true);

    // Go back to add
    act(() => {
      result.current.goBack();
    });

    expect(result.current.screen).toBe("add");
    expect(result.current.canGoBack).toBe(true);

    // Go back to main
    act(() => {
      result.current.goBack();
    });

    expect(result.current.screen).toBe("main");
    expect(result.current.canGoBack).toBe(false);
  });

  it("history 비어있으면 main으로", () => {
    const { result } = renderHook(() => useNavigation("search"));

    // No navigation history, goBack should go to main
    act(() => {
      result.current.goBack();
    });

    expect(result.current.screen).toBe("main");
    expect(result.current.canGoBack).toBe(false);
  });

  it("params 전달 및 조회", () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.navigate("detail", { contextId: "abc123" });
    });

    expect(result.current.screen).toBe("detail");
    expect(result.current.params).toEqual({ contextId: "abc123" });
  });

  it("goBack 시 params 초기화", () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.navigate("detail", { contextId: "abc123" });
    });

    expect(result.current.params).toEqual({ contextId: "abc123" });

    act(() => {
      result.current.goBack();
    });

    expect(result.current.params).toBeUndefined();
  });

  it("연속 navigate 시 history 누적", () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.navigate("add");
    });
    act(() => {
      result.current.navigate("search");
    });
    act(() => {
      result.current.navigate("list");
    });
    act(() => {
      result.current.navigate("detail");
    });

    expect(result.current.screen).toBe("detail");

    // Go back through history
    act(() => {
      result.current.goBack();
    });
    expect(result.current.screen).toBe("list");

    act(() => {
      result.current.goBack();
    });
    expect(result.current.screen).toBe("search");

    act(() => {
      result.current.goBack();
    });
    expect(result.current.screen).toBe("add");

    act(() => {
      result.current.goBack();
    });
    expect(result.current.screen).toBe("main");
  });
});
