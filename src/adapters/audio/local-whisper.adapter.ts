/**
 * Local Whisper Adapter
 *
 * Uses whisper.cpp via whisper-node for offline transcription
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import type { TranscriptionProvider, WhisperModel } from './whisper.types.js';
import {
  ModelManager,
  getModelManager,
  type DownloadProgressCallback,
} from './model-manager.service.js';
import {
  TranscriptionError,
  ErrorCode,
} from '../../types/errors.js';
import {
  needsSplit,
  splitWavBufferWithVad,
  mergeTranscriptionsWithOverlap,
} from './audio-splitter.js';

/**
 * Local Whisper adapter configuration
 */
export interface LocalWhisperConfig {
  /**
   * Whisper model to use
   */
  model?: WhisperModel;

  /**
   * Custom vocabulary for improved recognition
   */
  vocabulary?: string[];

  /**
   * Language hint (e.g., 'ko', 'en')
   */
  language?: string;

  /**
   * Auto-download model if not present
   */
  autoDownload?: boolean;

  /**
   * Progress callback for model download
   */
  onDownloadProgress?: DownloadProgressCallback;

  /**
   * Custom model manager instance
   */
  modelManager?: ModelManager;
}

/**
 * Default local whisper configuration
 */
const DEFAULT_CONFIG: Required<Omit<LocalWhisperConfig, 'onDownloadProgress' | 'modelManager'>> = {
  model: 'base',
  vocabulary: [],
  language: 'ko',
  autoDownload: true,
};

/**
 * Local Whisper transcription adapter
 * Uses whisper.cpp for offline transcription
 */
export class LocalWhisperAdapter implements TranscriptionProvider {
  private config: Required<Omit<LocalWhisperConfig, 'onDownloadProgress' | 'modelManager'>>;
  private modelManager: ModelManager;
  private onDownloadProgress?: DownloadProgressCallback;

  constructor(options: LocalWhisperConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...options,
    };
    this.modelManager = options.modelManager ?? getModelManager();
    this.onDownloadProgress = options.onDownloadProgress;
  }

  /**
   * Check if the model is ready for transcription
   */
  isModelReady(): boolean {
    return this.modelManager.isModelDownloaded(this.config.model);
  }

  /**
   * Ensure model is downloaded
   */
  async ensureModel(): Promise<string> {
    if (this.isModelReady()) {
      return this.modelManager.getModelPath(this.config.model);
    }

    if (!this.config.autoDownload) {
      throw new TranscriptionError(
        `Whisper model '${this.config.model}' is not downloaded`,
        ErrorCode.TRANSCRIPTION_FAILED,
        true
      );
    }

    return this.modelManager.downloadModel(
      this.config.model,
      this.onDownloadProgress
    );
  }

  /**
   * Transcribe an audio file
   */
  async transcribeFile(filePath: string): Promise<string> {
    // Check file exists
    if (!existsSync(filePath)) {
      throw new TranscriptionError(
        `Audio file not found: ${filePath}`,
        ErrorCode.TRANSCRIPTION_FILE_NOT_FOUND,
        false
      );
    }

    // Ensure model is ready
    await this.ensureModel();

    // Read file and transcribe
    const buffer = readFileSync(filePath);
    return this.transcribeBuffer(buffer, filePath);
  }

  /**
   * Transcribe an audio buffer
   */
  async transcribeBuffer(
    buffer: Buffer,
    filename = 'audio.wav'
  ): Promise<string> {
    // Ensure model is ready
    if (!this.isModelReady() && !this.config.autoDownload) {
      throw new TranscriptionError(
        `Whisper model '${this.config.model}' is not downloaded`,
        ErrorCode.TRANSCRIPTION_FAILED,
        true
      );
    }

    await this.ensureModel();

    // Check if splitting is needed
    if (needsSplit(buffer.length)) {
      return this.transcribeWithSplit(buffer);
    }

    return this.transcribeSingleBuffer(buffer, filename);
  }

  /**
   * Transcribe a single buffer (no splitting)
   */
  private async transcribeSingleBuffer(
    buffer: Buffer,
    _filename = 'audio.wav'
  ): Promise<string> {
    const modelPath = this.modelManager.getModelPath(this.config.model);

    // Write buffer to temp file (whisper-node requires file path)
    const tempPath = join(tmpdir(), `mch-whisper-${randomUUID()}.wav`);

    try {
      writeFileSync(tempPath, buffer);

      // Build whisper options
      const whisperOpts = {
        language: this.config.language,
        word_timestamps: false,
        ...(this.config.vocabulary.length > 0 && {
          initial_prompt: this.config.vocabulary.join(', '),
        }),
      };

      // Run whisper (lazy-load to avoid eager whisper.cpp compilation at startup)
      const { default: whisper } = await import('whisper-node');
      const result = await whisper(tempPath, {
        modelPath,
        whisperOptions: whisperOpts,
      });

      // Extract text from result
      if (Array.isArray(result)) {
        return result
          .map((segment: { speech: string }) => segment.speech)
          .join(' ')
          .trim();
      }

      return '';
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      throw new TranscriptionError(
        `Local transcription failed: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.TRANSCRIPTION_FAILED,
        true,
        originalError
      );
    } finally {
      // Clean up temp file
      if (existsSync(tempPath)) {
        unlinkSync(tempPath);
      }
    }
  }

  /**
   * Split buffer into chunks and transcribe each
   */
  private async transcribeWithSplit(buffer: Buffer): Promise<string> {
    // Use VAD-based splitting
    const chunks = splitWavBufferWithVad(buffer);
    const transcriptions: string[] = [];

    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const text = await this.transcribeSingleBuffer(
          chunk,
          `chunk-${i + 1}.wav`
        );
        transcriptions.push(text);
      }

      // Use overlap-aware merging
      return mergeTranscriptionsWithOverlap(transcriptions);
    } catch (error) {
      if (error instanceof TranscriptionError) {
        throw error;
      }

      const originalError = error instanceof Error ? error : undefined;
      throw new TranscriptionError(
        `Transcription failed during chunk processing: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.TRANSCRIPTION_FAILED,
        true,
        originalError
      );
    }
  }

  /**
   * Get current model info
   */
  getModelInfo(): { model: WhisperModel; path: string; ready: boolean } {
    return {
      model: this.config.model,
      path: this.modelManager.getModelPath(this.config.model),
      ready: this.isModelReady(),
    };
  }
}
