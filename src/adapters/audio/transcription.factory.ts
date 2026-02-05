/**
 * Transcription Factory
 *
 * Creates transcription providers based on configuration.
 * Supports local Whisper, OpenAI API, and auto mode with fallback.
 */

import type {
  TranscriptionProvider,
  TranscriptionConfig,
  TranscriptionMode,
} from './whisper.types.js';
import { DEFAULT_TRANSCRIPTION_CONFIG } from './whisper.types.js';
import { LocalWhisperAdapter } from './local-whisper.adapter.js';
import { OpenAIWhisperAdapter } from './openai-whisper.adapter.js';
import { TranscriptionError, ErrorCode } from '../../types/errors.js';

/**
 * Factory options for creating transcription providers
 */
export interface TranscriptionFactoryOptions {
  /**
   * OpenAI API key (required for 'api' and 'auto' modes)
   */
  openaiApiKey?: string | null;

  /**
   * Transcription configuration
   */
  config?: Partial<TranscriptionConfig>;

  /**
   * Progress callback for model download
   */
  onDownloadProgress?: (downloaded: number, total: number) => void;
}

/**
 * Auto-fallback transcription provider
 * Tries local first, falls back to API on failure
 */
class AutoFallbackAdapter implements TranscriptionProvider {
  private localAdapter: LocalWhisperAdapter;
  private apiAdapter: OpenAIWhisperAdapter | null;

  constructor(
    localAdapter: LocalWhisperAdapter,
    apiAdapter: OpenAIWhisperAdapter | null
  ) {
    this.localAdapter = localAdapter;
    this.apiAdapter = apiAdapter;
  }

  async transcribeFile(filePath: string): Promise<string> {
    try {
      return await this.localAdapter.transcribeFile(filePath);
    } catch (error) {
      if (this.apiAdapter) {
        console.warn('[Transcription] Local failed, falling back to API');
        return this.apiAdapter.transcribeFile(filePath);
      }
      throw error;
    }
  }

  async transcribeBuffer(buffer: Buffer, filename?: string): Promise<string> {
    try {
      return await this.localAdapter.transcribeBuffer(buffer, filename);
    } catch (error) {
      if (this.apiAdapter) {
        console.warn('[Transcription] Local failed, falling back to API');
        return this.apiAdapter.transcribeBuffer(buffer, filename);
      }
      throw error;
    }
  }
}

/**
 * Transcription Factory
 *
 * Creates appropriate transcription provider based on mode:
 * - local: Uses local Whisper only
 * - api: Uses OpenAI API only
 * - auto: Tries local first, falls back to API
 */
export class TranscriptionFactory {
  /**
   * Create a transcription provider
   */
  static create(options: TranscriptionFactoryOptions = {}): TranscriptionProvider {
    const config: TranscriptionConfig = {
      ...DEFAULT_TRANSCRIPTION_CONFIG,
      ...options.config,
    };

    return this.createForMode(config.mode, options, config);
  }

  /**
   * Create provider for specific mode
   */
  private static createForMode(
    mode: TranscriptionMode,
    options: TranscriptionFactoryOptions,
    config: TranscriptionConfig
  ): TranscriptionProvider {
    switch (mode) {
      case 'local':
        return this.createLocalAdapter(config, options.onDownloadProgress);

      case 'api':
        return this.createApiAdapter(options.openaiApiKey, config);

      case 'auto':
      default:
        return this.createAutoAdapter(options, config);
    }
  }

  /**
   * Create local Whisper adapter
   */
  private static createLocalAdapter(
    config: TranscriptionConfig,
    onDownloadProgress?: (downloaded: number, total: number) => void
  ): LocalWhisperAdapter {
    return new LocalWhisperAdapter({
      model: config.localModel,
      vocabulary: config.vocabulary,
      autoDownload: true,
      onDownloadProgress,
    });
  }

  /**
   * Create OpenAI API adapter
   */
  private static createApiAdapter(
    apiKey: string | null | undefined,
    config: TranscriptionConfig
  ): OpenAIWhisperAdapter {
    if (!apiKey) {
      throw new TranscriptionError(
        'OpenAI API key is required for API transcription mode',
        ErrorCode.TRANSCRIPTION_FAILED,
        true
      );
    }

    return new OpenAIWhisperAdapter({
      apiKey,
      vocabulary: config.vocabulary,
      useVad: config.useVad,
    });
  }

  /**
   * Create auto-fallback adapter
   */
  private static createAutoAdapter(
    options: TranscriptionFactoryOptions,
    config: TranscriptionConfig
  ): TranscriptionProvider {
    const localAdapter = this.createLocalAdapter(config, options.onDownloadProgress);

    // API adapter is optional for auto mode
    let apiAdapter: OpenAIWhisperAdapter | null = null;
    if (options.openaiApiKey) {
      apiAdapter = new OpenAIWhisperAdapter({
        apiKey: options.openaiApiKey,
        vocabulary: config.vocabulary,
        useVad: config.useVad,
      });
    }

    return new AutoFallbackAdapter(localAdapter, apiAdapter);
  }

  /**
   * Check if local mode is available (model downloaded)
   */
  static isLocalAvailable(model = 'base'): boolean {
    const adapter = new LocalWhisperAdapter({
      model: model as 'tiny' | 'base' | 'small' | 'medium' | 'large',
      autoDownload: false,
    });
    return adapter.isModelReady();
  }
}

/**
 * Convenience function to create a transcription provider
 */
export function createTranscriptionProvider(
  options: TranscriptionFactoryOptions = {}
): TranscriptionProvider {
  return TranscriptionFactory.create(options);
}
