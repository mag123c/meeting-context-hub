import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { homedir } from 'os';
import type { PartialConfig } from './config.interface.js';

/**
 * Get the config file path
 */
export function getConfigFilePath(): string {
  return resolve(homedir(), '.mch', 'config.json');
}

/**
 * Load config from file
 */
export function loadFileConfig(): PartialConfig | null {
  const configPath = getConfigFilePath();

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as PartialConfig;
  } catch {
    // Invalid JSON or read error
    return null;
  }
}

/**
 * Save config to file
 */
export function saveFileConfig(config: PartialConfig): void {
  const configPath = getConfigFilePath();
  const dir = dirname(configPath);

  // Ensure directory exists
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Merge with existing config
  const existing = loadFileConfig() || {};
  const merged = { ...existing, ...config };

  writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf-8');
}

/**
 * Set a single API key in file config
 */
export function setApiKeyInFile(key: 'anthropicApiKey' | 'openaiApiKey', value: string): void {
  saveFileConfig({ [key]: value });
}

/**
 * Remove a key from file config
 */
export function removeKeyFromFile(key: keyof PartialConfig): void {
  const existing = loadFileConfig();
  if (!existing) return;

  delete existing[key];
  const configPath = getConfigFilePath();
  writeFileSync(configPath, JSON.stringify(existing, null, 2), 'utf-8');
}

/**
 * Check if config file exists
 */
export function configFileExists(): boolean {
  return existsSync(getConfigFilePath());
}
