// AI adapters
export { ClaudeAdapter, AIExtractionError, type AIProvider } from './ai/index.js';
export { OpenAIAdapter, EmbeddingError, type EmbeddingProvider } from './ai/index.js';

// Audio adapters
export {
  WhisperAdapter,
  TranscriptionError,
  type TranscriptionProvider,
  SoxRecordingAdapter,
  RecordingError,
  type RecordingProvider,
  type RecordingState,
  type RecordingEvents,
} from './audio/index.js';

// Storage adapters
export { SQLiteAdapter, type StorageProvider } from './storage/index.js';

// Config adapters
export {
  // Types
  ConfigError,
  type Config,
  type ConfigStatus,
  type ConfigSource,
  type PartialConfig,
  // Functions
  loadConfig,
  getConfigStatus,
  validateApiKeyFormat,
  getDbDirectory,
  maskApiKey,
  // File config
  loadFileConfig,
  saveFileConfig,
  setApiKeyInFile,
  removeKeyFromFile,
  configFileExists,
  getConfigFilePath,
} from './config/index.js';
