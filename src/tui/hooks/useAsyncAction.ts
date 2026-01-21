import { useState, useCallback } from "react";

export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

export interface UseAsyncActionResult<T, Args extends unknown[]> {
  state: AsyncState<T>;
  execute: (...args: Args) => Promise<void>;
  reset: () => void;
}

export function useAsyncAction<T, Args extends unknown[]>(
  action: (...args: Args) => Promise<T>
): UseAsyncActionResult<T, Args> {
  const [state, setState] = useState<AsyncState<T>>({ status: "idle" });

  const execute = useCallback(
    async (...args: Args) => {
      setState({ status: "loading" });
      try {
        const data = await action(...args);
        setState({ status: "success", data });
      } catch (err) {
        const error = err instanceof Error ? err.message : "Unknown error";
        setState({ status: "error", error });
      }
    },
    [action]
  );

  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  return { state, execute, reset };
}
