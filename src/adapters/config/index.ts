// Config interface and types
export {
  ConfigError,
  type Config,
  type ConfigStatus,
  type ConfigSource,
  type PartialConfig,
} from './config.interface.js';

// Environment-based config (with file priority)
export {
  loadConfig,
  getConfigStatus,
  validateApiKeyFormat,
  getDbDirectory,
  maskApiKey,
} from './env.adapter.js';

// File-based config operations
export {
  loadFileConfig,
  saveFileConfig,
  setApiKeyInFile,
  removeKeyFromFile,
  configFileExists,
  getConfigFilePath,
} from './file-config.adapter.js';
