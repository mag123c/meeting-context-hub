import { ConfigError, ErrorCode } from '../../types/errors.js';

/**
 * Configuration interface
 */
export interface Config {
  anthropicApiKey: string | null;
  openaiApiKey: string | null;
  dbPath: string;
  language: 'ko' | 'en';
  contextLanguage: 'ko' | 'en';
}

/**
 * Partial config for file storage (all fields optional)
 */
export interface PartialConfig {
  anthropicApiKey?: string;
  openaiApiKey?: string;
  dbPath?: string;
  language?: 'ko' | 'en';
  contextLanguage?: 'ko' | 'en';
}

/**
 * Config source tracking
 */
export type ConfigSource = 'file' | 'env' | 'default' | 'none';

/**
 * Config status for display
 */
export interface ConfigStatus {
  anthropicKey: {
    set: boolean;
    source: ConfigSource;
    masked: string; // sk-ant-***xxx
  };
  openaiKey: {
    set: boolean;
    source: ConfigSource;
    masked: string;
  };
  dbPath: string;
  language: 'ko' | 'en';
  contextLanguage: 'ko' | 'en';
}

/**
 * Validate required API keys
 */
export function validateConfig(config: Config): void {
  const missingKeys: string[] = [];

  if (!config.anthropicApiKey) {
    missingKeys.push('ANTHROPIC_API_KEY');
  }

  if (!config.openaiApiKey) {
    missingKeys.push('OPENAI_API_KEY');
  }

  if (missingKeys.length > 0) {
    throw new ConfigError(
      `Missing required API keys: ${missingKeys.join(', ')}`,
      ErrorCode.MISSING_API_KEY,
      missingKeys,
      true
    );
  }
}

// Re-export ConfigError for backward compatibility
export { ConfigError };
