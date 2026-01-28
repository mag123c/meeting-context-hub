import { useState, useEffect } from 'react';
import { loadConfig, ConfigError, type Config } from '../../adapters/config/index.js';
import { SQLiteAdapter } from '../../adapters/storage/index.js';
import { ClaudeAdapter, OpenAIAdapter } from '../../adapters/ai/index.js';
import { WhisperAdapter, SoxRecordingAdapter } from '../../adapters/audio/index.js';
import { ExtractService, EmbeddingService, ChainService, DictionaryService, PromptContextService } from '../../core/services/index.js';
import {
  AddContextUseCase,
  ListContextsUseCase,
  ManageProjectUseCase,
  ManageContextUseCase,
  GetContextUseCase,
  SearchContextUseCase,
  RecordContextUseCase,
  TranslateContextUseCase,
} from '../../core/usecases/index.js';

interface Services {
  addContext: AddContextUseCase;
  listContexts: ListContextsUseCase;
  manageProject: ManageProjectUseCase;
  manageContext: ManageContextUseCase;
  getContext: GetContextUseCase;
  searchContext: SearchContextUseCase;
  recordContext: RecordContextUseCase | null;
  translateContext: TranslateContextUseCase;
  dictionary: DictionaryService;
  promptContext: PromptContextService;
}

interface UseServicesResult {
  services: Services | null;
  config: Config | null;
  error: Error | null;
  loading: boolean;
  needsConfig: boolean;
}

let servicesInstance: Services | null = null;
let storageInstance: SQLiteAdapter | null = null;
let configInstance: Config | null = null;
let needsConfigFlag = false;

// Callbacks to notify state changes
const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach(listener => listener());
}

/**
 * Initialize services
 */
async function initializeServices(): Promise<void> {
  try {
    // Try to load config (may throw if keys missing)
    const cfg = loadConfig({ requireKeys: true });
    configInstance = cfg;
    needsConfigFlag = false;

    // Initialize storage
    const storage = new SQLiteAdapter(cfg.dbPath);
    await storage.initialize();
    storageInstance = storage;

    // Initialize AI (only if we have the key)
    if (cfg.anthropicApiKey) {
      const ai = new ClaudeAdapter(cfg.anthropicApiKey);

      // Initialize embedding provider (optional - only if OpenAI key is set)
      const embeddingProvider = cfg.openaiApiKey
        ? new OpenAIAdapter(cfg.openaiApiKey)
        : null;

      // Initialize services
      const extractService = new ExtractService(ai);
      const embeddingService = new EmbeddingService(embeddingProvider);
      const chainService = new ChainService();

      // Initialize recording services (requires OpenAI key for Whisper)
      let recordContext: RecordContextUseCase | null = null;
      if (cfg.openaiApiKey) {
        const whisperAdapter = new WhisperAdapter(cfg.openaiApiKey);
        const recordingAdapter = new SoxRecordingAdapter();
        recordContext = new RecordContextUseCase(
          recordingAdapter,
          whisperAdapter,
          extractService,
          embeddingService,
          chainService,
          storage
        );
      }

      servicesInstance = {
        addContext: new AddContextUseCase(extractService, embeddingService, chainService, storage),
        listContexts: new ListContextsUseCase(storage),
        manageProject: new ManageProjectUseCase(storage),
        manageContext: new ManageContextUseCase(storage, embeddingService),
        getContext: new GetContextUseCase(storage),
        searchContext: new SearchContextUseCase(storage, embeddingService, chainService),
        recordContext,
        translateContext: new TranslateContextUseCase(storage, ai, embeddingService),
        dictionary: new DictionaryService(storage),
        promptContext: new PromptContextService(storage),
      };
    }
  } catch (err) {
    if (err instanceof ConfigError && err.missingKeys.length > 0) {
      // Config is missing required keys - this is expected on first run
      needsConfigFlag = true;

      // Still initialize storage for settings to work
      try {
        const cfg = loadConfig({ requireKeys: false });
        const storage = new SQLiteAdapter(cfg.dbPath);
        await storage.initialize();
        storageInstance = storage;
      } catch {
        // Ignore storage init errors in this case
      }
    } else {
      throw err;
    }
  }
}

/**
 * Reinitialize services after config change
 */
export async function reinitializeServices(): Promise<void> {
  // Close existing storage
  if (storageInstance) {
    storageInstance.close();
    storageInstance = null;
  }
  servicesInstance = null;
  configInstance = null;
  needsConfigFlag = false;

  // Reinitialize
  await initializeServices();

  // Notify listeners
  notifyListeners();
}

/**
 * Hook to initialize and access services
 */
export function useServices(): UseServicesResult {
  const [services, setServices] = useState<Services | null>(servicesInstance);
  const [config, setConfig] = useState<Config | null>(configInstance);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(!servicesInstance && !needsConfigFlag);
  const [needsConfig, setNeedsConfig] = useState(needsConfigFlag);

  useEffect(() => {
    // Register listener for reinitialize
    const listener = () => {
      setServices(servicesInstance);
      setConfig(configInstance);
      setNeedsConfig(needsConfigFlag);
      setLoading(false);
    };
    listeners.add(listener);

    // If already initialized, use cached values
    if (servicesInstance || needsConfigFlag) {
      listener();
      return () => {
        listeners.delete(listener);
      };
    }

    // Initialize
    async function initialize() {
      try {
        await initializeServices();
        setServices(servicesInstance);
        setConfig(configInstance);
        setNeedsConfig(needsConfigFlag);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    }

    initialize();

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { services, config, error, loading, needsConfig };
}

/**
 * Cleanup function to close storage on app exit
 */
export function cleanup(): void {
  if (storageInstance) {
    storageInstance.close();
    storageInstance = null;
  }
  servicesInstance = null;
  configInstance = null;
  needsConfigFlag = false;
  listeners.clear();
}
