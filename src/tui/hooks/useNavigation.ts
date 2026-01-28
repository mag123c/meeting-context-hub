import { useState, useCallback } from 'react';

export type Screen =
  | 'main'
  | 'add'
  | 'list'
  | 'detail'
  | 'projects'
  | 'new-project'
  | 'settings'
  | 'search'
  | 'record'
  | 'translate';

interface NavigationState {
  screen: Screen;
  params: Record<string, unknown>;
}

interface UseNavigationResult {
  screen: Screen;
  params: Record<string, unknown>;
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
}

/**
 * Hook for screen navigation
 */
export function useNavigation(): UseNavigationResult {
  const [history, setHistory] = useState<NavigationState[]>([
    { screen: 'main', params: {} },
  ]);

  const currentState = history[history.length - 1];

  const navigate = useCallback((screen: Screen, params: Record<string, unknown> = {}) => {
    setHistory(prev => [...prev, { screen, params }]);
  }, []);

  const goBack = useCallback(() => {
    setHistory(prev => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, -1);
    });
  }, []);

  return {
    screen: currentState.screen,
    params: currentState.params,
    navigate,
    goBack,
  };
}
