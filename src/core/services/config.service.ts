import {
  loadConfig,
  getConfigStatus,
  validateApiKeyFormat,
  setApiKeyInFile,
  saveFileConfig,
  type Config,
  type ConfigStatus,
} from '../../adapters/config/index.js';

/**
 * Service for managing application configuration
 * This service can be used by both TUI and GUI
 */
export class ConfigService {

  /**
   * Get current configuration
   * @param options.requireKeys - If false, returns config even without required keys
   */
  getConfig(options?: { requireKeys?: boolean }): Config {
    return loadConfig(options);
  }

  /**
   * Get configuration status with source information
   */
  getConfigStatus(): ConfigStatus {
    return getConfigStatus();
  }

  /**
   * Set a config value (language or dbPath)
   */
  async setConfigValue<K extends 'language' | 'dbPath'>(
    key: K,
    value: Config[K]
  ): Promise<{ success: boolean; error?: string }> {
    // Validate
    if (key === 'language') {
      if (value !== 'ko' && value !== 'en') {
        return { success: false, error: 'Invalid language. Must be "ko" or "en".' };
      }
    }

    if (key === 'dbPath') {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return { success: false, error: 'Database path cannot be empty.' };
      }
    }

    // Save to file
    try {
      saveFileConfig({ [key]: value });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save config',
      };
    }
  }

  /**
   * Set an API key (saves to file)
   */
  async setApiKey(key: 'anthropic' | 'openai', value: string): Promise<{ success: boolean; error?: string }> {
    // Validate format
    const validation = validateApiKeyFormat(key, value);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Save to file
    try {
      const configKey = key === 'anthropic' ? 'anthropicApiKey' : 'openaiApiKey';
      setApiKeyInFile(configKey, value.trim());

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save API key',
      };
    }
  }

  /**
   * Validate API key format
   */
  validateApiKeyFormat(key: 'anthropic' | 'openai', value: string): { valid: boolean; error?: string } {
    return validateApiKeyFormat(key, value);
  }

  /**
   * Check if required configuration is present
   */
  isConfigured(): boolean {
    try {
      this.getConfig({ requireKeys: true });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get missing required keys
   */
  getMissingKeys(): string[] {
    const status = this.getConfigStatus();
    const missing: string[] = [];

    if (!status.anthropicKey.set) {
      missing.push('ANTHROPIC_API_KEY');
    }

    return missing;
  }
}
