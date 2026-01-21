import { useState, useCallback } from "react";
import type { Screen } from "../App.js";

export interface NavigationState {
  screen: Screen;
  params?: Record<string, string>;
  history: Screen[];
}

export interface UseNavigationResult {
  screen: Screen;
  params?: Record<string, string>;
  navigate: (screen: Screen, params?: Record<string, string>) => void;
  goBack: () => void;
  canGoBack: boolean;
}

export function useNavigation(initialScreen: Screen = "main"): UseNavigationResult {
  const [state, setState] = useState<NavigationState>({
    screen: initialScreen,
    history: [],
  });

  const navigate = useCallback(
    (screen: Screen, params?: Record<string, string>) => {
      setState((prev) => ({
        screen,
        params,
        history: [...prev.history, prev.screen],
      }));
    },
    []
  );

  const goBack = useCallback(() => {
    setState((prev) => {
      const history = [...prev.history];
      const previousScreen = history.pop() || "main";
      return {
        screen: previousScreen,
        history,
        params: undefined,
      };
    });
  }, []);

  return {
    screen: state.screen,
    params: state.params,
    navigate,
    goBack,
    canGoBack: state.history.length > 0,
  };
}
