/**
 * Configuration interface
 */
export interface Config {
  anthropicApiKey: string | null;
  openaiApiKey: string | null;
  dbPath: string;
  language: 'ko' | 'en';
}

/**
 * Partial config for file storage (all fields optional)
 */
export interface PartialConfig {
  anthropicApiKey?: string;
  openaiApiKey?: string;
  dbPath?: string;
  language?: 'ko' | 'en';
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
}

/**
 * Configuration validation errors
 */
export class ConfigError extends Error {
  constructor(
    message: string,
    public readonly missingKeys: string[] = []
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}
