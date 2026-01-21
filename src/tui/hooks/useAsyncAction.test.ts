/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAsyncAction } from "./useAsyncAction.js";

describe("useAsyncAction", () => {
  it("초기 상태는 idle", () => {
    const mockAction = vi.fn();
    const { result } = renderHook(() => useAsyncAction(mockAction));

    expect(result.current.state).toEqual({ status: "idle" });
  });

  it("execute 호출 시 loading 상태", async () => {
    let resolvePromise: (value: string) => void;
    const mockAction = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolvePromise = resolve;
        })
    );

    const { result } = renderHook(() => useAsyncAction(mockAction));

    act(() => {
      result.current.execute();
    });

    expect(result.current.state).toEqual({ status: "loading" });

    // Resolve the promise to clean up
    await act(async () => {
      resolvePromise!("done");
    });
  });

  it("성공 시 success 상태 + data", async () => {
    const mockAction = vi.fn().mockResolvedValue("result data");

    const { result } = renderHook(() => useAsyncAction(mockAction));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.state).toEqual({
      status: "success",
      data: "result data",
    });
  });

  it("실패 시 error 상태 + message", async () => {
    const mockAction = vi.fn().mockRejectedValue(new Error("Test error"));

    const { result } = renderHook(() => useAsyncAction(mockAction));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.state).toEqual({
      status: "error",
      error: "Test error",
    });
  });

  it("Error가 아닌 예외 시 Unknown error", async () => {
    const mockAction = vi.fn().mockRejectedValue("string error");

    const { result } = renderHook(() => useAsyncAction(mockAction));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.state).toEqual({
      status: "error",
      error: "Unknown error",
    });
  });

  it("reset 호출 시 idle로 복귀", async () => {
    const mockAction = vi.fn().mockResolvedValue("data");

    const { result } = renderHook(() => useAsyncAction(mockAction));

    // First execute and complete
    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.state.status).toBe("success");

    // Then reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toEqual({ status: "idle" });
  });

  it("action에 인자 전달", async () => {
    const mockAction = vi.fn().mockImplementation((a: number, b: string) => {
      return Promise.resolve(`${a}-${b}`);
    });

    const { result } = renderHook(() =>
      useAsyncAction<string, [number, string]>(mockAction)
    );

    await act(async () => {
      await result.current.execute(42, "test");
    });

    expect(mockAction).toHaveBeenCalledWith(42, "test");
    expect(result.current.state).toEqual({
      status: "success",
      data: "42-test",
    });
  });
});
