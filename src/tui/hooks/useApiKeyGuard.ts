/**
 * API Key Guard Hook
 * Checks if required API keys are available before allowing screen access
 */

import { useState, useCallback } from "react";
import {
  hasRequiredKeys,
  getMissingKeys,
  type ApiKeyProvider,
} from "../../config/api-key-check.js";
import type { Screen } from "../App.js";

/**
 * Required API keys for each screen
 */
const SCREEN_REQUIREMENTS: Record<Screen, ApiKeyProvider[]> = {
  main: [],
  config: [],
  list: [],
  detail: [],
  add: ["anthropic", "openai"], // Claude for tagging, OpenAI for embedding
  search: [], // Will check per search mode
};

/**
 * Search mode requirements
 */
export const SEARCH_MODE_REQUIREMENTS: Record<string, ApiKeyProvider[]> = {
  semantic: ["openai"], // OpenAI for embedding
  exact: [],
  tag: [],
};

export interface ApiKeyGuardState {
  /** Whether we're showing the "keys missing" prompt */
  showPrompt: boolean;
  /** Which screen the user was trying to access */
  targetScreen: Screen | null;
  /** Which keys are missing */
  missingKeys: ApiKeyProvider[];
}

export interface UseApiKeyGuardResult {
  /** Current guard state */
  guardState: ApiKeyGuardState;
  /** Check if navigation should be allowed, returns true if OK, false if blocked */
  checkNavigation: (screen: Screen) => boolean;
  /** Check if search mode should be allowed */
  checkSearchMode: (mode: string) => boolean;
  /** User chose to go to config */
  confirmGoToConfig: () => void;
  /** User chose to cancel */
  cancelPrompt: () => void;
  /** Reset guard state */
  resetGuard: () => void;
}

export function useApiKeyGuard(): UseApiKeyGuardResult {
  const [guardState, setGuardState] = useState<ApiKeyGuardState>({
    showPrompt: false,
    targetScreen: null,
    missingKeys: [],
  });

  const checkNavigation = useCallback((screen: Screen): boolean => {
    const requirements = SCREEN_REQUIREMENTS[screen];

    if (requirements.length === 0) {
      return true; // No requirements
    }

    if (hasRequiredKeys(requirements)) {
      return true; // All keys available
    }

    // Keys missing - show prompt
    const missing = getMissingKeys(requirements);
    setGuardState({
      showPrompt: true,
      targetScreen: screen,
      missingKeys: missing,
    });
    return false;
  }, []);

  const checkSearchMode = useCallback((mode: string): boolean => {
    const requirements = SEARCH_MODE_REQUIREMENTS[mode] || [];

    if (requirements.length === 0) {
      return true;
    }

    if (hasRequiredKeys(requirements)) {
      return true;
    }

    const missing = getMissingKeys(requirements);
    setGuardState({
      showPrompt: true,
      targetScreen: "search",
      missingKeys: missing,
    });
    return false;
  }, []);

  const confirmGoToConfig = useCallback(() => {
    setGuardState({
      showPrompt: false,
      targetScreen: null,
      missingKeys: [],
    });
  }, []);

  const cancelPrompt = useCallback(() => {
    setGuardState({
      showPrompt: false,
      targetScreen: null,
      missingKeys: [],
    });
  }, []);

  const resetGuard = useCallback(() => {
    setGuardState({
      showPrompt: false,
      targetScreen: null,
      missingKeys: [],
    });
  }, []);

  return {
    guardState,
    checkNavigation,
    checkSearchMode,
    confirmGoToConfig,
    cancelPrompt,
    resetGuard,
  };
}
