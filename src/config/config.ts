import { existsSync } from "fs";
import { getApiKeyFromKeychain } from "./keychain.js";
import { getEnv, DEFAULT_OBSIDIAN_PATH, DEFAULT_MCH_FOLDER } from "./env.js";
import { getStoredVaultPath } from "./storage.js";
import { APIKeyMissingError, APIKeyFormatError, ConfigError } from "../errors/index.js";

export interface Config {
  anthropicApiKey: string;
  openaiApiKey: string;
  obsidianVaultPath: string;
  mchFolder: string;
}

export interface ConfigValidationResult {
  valid: boolean;
  issues: string[];
}

/**
 * Validate Anthropic API key format
 */
function isValidAnthropicKeyFormat(key: string): boolean {
  // Anthropic keys start with sk-ant-
  return key.startsWith("sk-ant-") && key.length > 20;
}

/**
 * Validate OpenAI API key format
 */
function isValidOpenAIKeyFormat(key: string): boolean {
  // OpenAI keys start with sk- (but not sk-ant-)
  return key.startsWith("sk-") && !key.startsWith("sk-ant-") && key.length > 20;
}

function getApiKey(
  keychainAccount: string,
  envVar: string,
  provider: "anthropic" | "openai"
): string {
  const fromKeychain = getApiKeyFromKeychain(keychainAccount);
  if (fromKeychain) {
    return fromKeychain;
  }

  const fromEnv = getEnv(envVar);
  if (fromEnv) {
    return fromEnv;
  }

  throw new APIKeyMissingError(provider);
}

export function loadConfig(): Config {
  // Priority: ENV > stored config > default
  const vaultPath = getEnv("OBSIDIAN_VAULT_PATH") ?? getStoredVaultPath() ?? DEFAULT_OBSIDIAN_PATH;

  return {
    anthropicApiKey: getApiKey("ANTHROPIC_API_KEY", "ANTHROPIC_API_KEY", "anthropic"),
    openaiApiKey: getApiKey("OPENAI_API_KEY", "OPENAI_API_KEY", "openai"),
    obsidianVaultPath: vaultPath,
    mchFolder: getEnv("MCH_FOLDER") ?? DEFAULT_MCH_FOLDER,
  };
}

export function getObsidianPath(config: Config): string {
  return `${config.obsidianVaultPath}/${config.mchFolder}`;
}

/**
 * Validate API key format (does not check if key is actually valid with the provider)
 */
export function validateApiKeyFormat(
  key: string,
  provider: "anthropic" | "openai"
): void {
  if (provider === "anthropic" && !isValidAnthropicKeyFormat(key)) {
    throw new APIKeyFormatError(provider);
  }
  if (provider === "openai" && !isValidOpenAIKeyFormat(key)) {
    throw new APIKeyFormatError(provider);
  }
}

/**
 * Validate full configuration
 * Returns validation result with any issues found
 */
export function validateConfig(config: Config): ConfigValidationResult {
  const issues: string[] = [];

  // Validate API key formats
  if (!isValidAnthropicKeyFormat(config.anthropicApiKey)) {
    issues.push("Anthropic API key has invalid format (expected sk-ant-...)");
  }

  if (!isValidOpenAIKeyFormat(config.openaiApiKey)) {
    issues.push("OpenAI API key has invalid format (expected sk-...)");
  }

  // Validate Obsidian vault path exists
  if (!existsSync(config.obsidianVaultPath)) {
    issues.push(`Obsidian vault path does not exist: ${config.obsidianVaultPath}`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Load and validate config, throwing if invalid
 */
export function loadAndValidateConfig(): Config {
  const config = loadConfig();
  const validation = validateConfig(config);

  if (!validation.valid) {
    throw new ConfigError(
      `Configuration validation failed:\n${validation.issues.map(i => `  - ${i}`).join("\n")}`
    );
  }

  return config;
}
