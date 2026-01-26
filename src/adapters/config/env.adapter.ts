import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import type { Config, ConfigStatus, ConfigSource } from './config.interface.js';
import { ConfigError } from './config.interface.js';
import { ErrorCode } from '../../types/errors.js';
import { loadFileConfig } from './file-config.adapter.js';

/**
 * Mask API key for display (show first 7 and last 4 chars)
 */
export function maskApiKey(key: string | null): string {
  if (!key) return '(not set)';
  if (key.length <= 11) return '***';
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
}

/**
 * Load configuration with priority: file > env > default
 */
export function loadConfig(options?: { requireKeys?: boolean }): Config {
  const requireKeys = options?.requireKeys ?? true;

  // 1. Load .env files (lowest priority for env vars)
  const envPaths = [
    resolve(process.cwd(), '.env.local'),
    resolve(process.cwd(), '.env'),
    resolve(homedir(), '.mch', '.env'),
  ];

  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      dotenvConfig({ path: envPath });
    }
  }

  // 2. Load file config (highest priority)
  const fileConfig = loadFileConfig();

  // 3. Resolve with priority: file > env > default
  const anthropicApiKey = fileConfig?.anthropicApiKey
    || process.env.ANTHROPIC_API_KEY
    || null;

  const openaiApiKey = fileConfig?.openaiApiKey
    || process.env.OPENAI_API_KEY
    || null;

  const dbPath = fileConfig?.dbPath
    || process.env.MCH_DB_PATH
    || resolve(homedir(), '.mch', 'data.db');

  const language = fileConfig?.language
    || (process.env.MCH_LANGUAGE as 'ko' | 'en')
    || 'en';

  // Validate required keys (only if requireKeys is true)
  if (requireKeys) {
    const missingKeys: string[] = [];
    if (!anthropicApiKey) {
      missingKeys.push('ANTHROPIC_API_KEY');
    }

    if (missingKeys.length > 0) {
      throw new ConfigError(
        `Missing required configuration: ${missingKeys.join(', ')}. Use Settings to configure.`,
        ErrorCode.MISSING_API_KEY,
        missingKeys,
        true
      );
    }
  }

  return {
    anthropicApiKey,
    openaiApiKey,
    dbPath,
    language,
  };
}

/**
 * Get configuration status with source information
 */
export function getConfigStatus(): ConfigStatus {
  const fileConfig = loadFileConfig();

  // Determine anthropic key source
  let anthropicSource: ConfigSource = 'none';
  let anthropicKey: string | null = null;

  if (fileConfig?.anthropicApiKey) {
    anthropicSource = 'file';
    anthropicKey = fileConfig.anthropicApiKey;
  } else if (process.env.ANTHROPIC_API_KEY) {
    anthropicSource = 'env';
    anthropicKey = process.env.ANTHROPIC_API_KEY;
  }

  // Determine openai key source
  let openaiSource: ConfigSource = 'none';
  let openaiKey: string | null = null;

  if (fileConfig?.openaiApiKey) {
    openaiSource = 'file';
    openaiKey = fileConfig.openaiApiKey;
  } else if (process.env.OPENAI_API_KEY) {
    openaiSource = 'env';
    openaiKey = process.env.OPENAI_API_KEY;
  }

  // DB path and language
  const dbPath = fileConfig?.dbPath
    || process.env.MCH_DB_PATH
    || resolve(homedir(), '.mch', 'data.db');

  const language = fileConfig?.language
    || (process.env.MCH_LANGUAGE as 'ko' | 'en')
    || 'en';

  return {
    anthropicKey: {
      set: !!anthropicKey,
      source: anthropicSource,
      masked: maskApiKey(anthropicKey),
    },
    openaiKey: {
      set: !!openaiKey,
      source: openaiSource,
      masked: maskApiKey(openaiKey),
    },
    dbPath,
    language,
  };
}

/**
 * Validate API key format
 */
export function validateApiKeyFormat(key: 'anthropic' | 'openai', value: string): { valid: boolean; error?: string } {
  if (!value || value.trim().length === 0) {
    return { valid: false, error: 'API key cannot be empty' };
  }

  if (key === 'anthropic') {
    if (!value.startsWith('sk-ant-')) {
      return { valid: false, error: 'Anthropic API key should start with "sk-ant-"' };
    }
  } else if (key === 'openai') {
    if (!value.startsWith('sk-')) {
      return { valid: false, error: 'OpenAI API key should start with "sk-"' };
    }
  }

  return { valid: true };
}

/**
 * Get default database directory
 */
export function getDbDirectory(): string {
  return resolve(homedir(), '.mch');
}

// Re-export for backwards compatibility
export { ConfigError } from './config.interface.js';
export type { Config, ConfigStatus, ConfigSource } from './config.interface.js';
