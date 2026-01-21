/**
 * API Key availability check (non-throwing)
 * Used for pre-flight checks before screen navigation
 */

import { getApiKeyFromKeychain } from "./keychain.js";
import { getEnv } from "./env.js";

export type ApiKeyProvider = "anthropic" | "openai";

export interface ApiKeyStatus {
  anthropic: boolean;
  openai: boolean;
}

/**
 * Check if an API key is available (keychain or env)
 */
function isApiKeyAvailable(
  keychainAccount: string,
  envVar: string
): boolean {
  const fromKeychain = getApiKeyFromKeychain(keychainAccount);
  if (fromKeychain && fromKeychain.length > 0) {
    return true;
  }

  const fromEnv = getEnv(envVar);
  if (fromEnv && fromEnv.length > 0) {
    return true;
  }

  return false;
}

/**
 * Get API key status for all providers
 */
export function getApiKeyStatus(): ApiKeyStatus {
  return {
    anthropic: isApiKeyAvailable("ANTHROPIC_API_KEY", "ANTHROPIC_API_KEY"),
    openai: isApiKeyAvailable("OPENAI_API_KEY", "OPENAI_API_KEY"),
  };
}

/**
 * Check if specific providers have keys configured
 */
export function hasRequiredKeys(providers: ApiKeyProvider[]): boolean {
  const status = getApiKeyStatus();
  return providers.every((provider) => status[provider]);
}

/**
 * Get list of missing API keys from required providers
 */
export function getMissingKeys(providers: ApiKeyProvider[]): ApiKeyProvider[] {
  const status = getApiKeyStatus();
  return providers.filter((provider) => !status[provider]);
}
