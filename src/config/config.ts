import { getApiKeyFromKeychain } from "./keychain.js";
import { getEnv, DEFAULT_OBSIDIAN_PATH, DEFAULT_MCH_FOLDER } from "./env.js";
import { APIKeyMissingError } from "../errors/index.js";

export interface Config {
  anthropicApiKey: string;
  openaiApiKey: string;
  obsidianVaultPath: string;
  mchFolder: string;
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
  return {
    anthropicApiKey: getApiKey("ANTHROPIC_API_KEY", "ANTHROPIC_API_KEY", "anthropic"),
    openaiApiKey: getApiKey("OPENAI_API_KEY", "OPENAI_API_KEY", "openai"),
    obsidianVaultPath: getEnv("OBSIDIAN_VAULT_PATH") ?? DEFAULT_OBSIDIAN_PATH,
    mchFolder: getEnv("MCH_FOLDER") ?? DEFAULT_MCH_FOLDER,
  };
}

export function getObsidianPath(config: Config): string {
  return `${config.obsidianVaultPath}/${config.mchFolder}`;
}
