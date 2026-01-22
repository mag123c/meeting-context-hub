import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CONFIG_DIR = join(homedir(), ".config", "mch");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export interface MchConfig {
  vaultPath?: string;
}

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function readConfig(): MchConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      const content = readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(content) as MchConfig;
    }
  } catch {
    // Ignore read errors, return empty config
  }
  return {};
}

function writeConfig(config: MchConfig): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

/**
 * Get stored vault path from config file.
 * Returns undefined if not set.
 */
export function getStoredVaultPath(): string | undefined {
  const config = readConfig();
  return config.vaultPath;
}

/**
 * Save vault path to config file.
 */
export function setStoredVaultPath(vaultPath: string): void {
  const config = readConfig();
  config.vaultPath = vaultPath;
  writeConfig(config);
}

/**
 * Check if vault path was set via environment variable.
 */
export function isVaultPathFromEnv(): boolean {
  return !!process.env.OBSIDIAN_VAULT_PATH;
}
