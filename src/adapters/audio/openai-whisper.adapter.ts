/**
 * OpenAI Whisper Adapter
 *
 * Uses OpenAI's Whisper API for audio transcription
 */

import OpenAI from 'openai';
import { createReadStream, existsSync, readFileSync, statSync } from 'fs';
import {
  TranscriptionError,
  ErrorCode,
  detectErrorCode,
} from '../../types/errors.js';
import { withRetry } from '../../core/services/retry.service.js';
import type { TranscriptionProvider } from './whisper.types.js';
import {
  needsSplit,
  splitWavBufferWithVad,
  mergeTranscriptionsWithOverlap,
} from './audio-splitter.js';

/**
 * OpenAI Whisper adapter configuration
 */
export interface OpenAIWhisperConfig {
  /**
   * OpenAI API key
   */
  apiKey: string;

  /**
   * Custom vocabulary for improved recognition
   * Will be passed as initial_prompt to help with domain-specific terms
   */
  vocabulary?: string[];

  /**
   * Language hint (e.g., 'ko', 'en')
   */
  language?: string;

  /**
   * Use VAD-based splitting (default: true)
   */
  useVad?: boolean;
}

/**
 * OpenAI Whisper adapter for audio transcription
 */
export class OpenAIWhisperAdapter implements TranscriptionProvider {
  private client: OpenAI;
  private model = 'whisper-1';
  private vocabulary: string[];
  private language: string;
  private useVad: boolean;

  constructor(config: OpenAIWhisperConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.vocabulary = config.vocabulary ?? [];
    this.language = config.language ?? 'ko';
    this.useVad = config.useVad ?? true;
  }

  /**
   * Update vocabulary for improved recognition
   */
  setVocabulary(vocabulary: string[]): void {
    this.vocabulary = vocabulary;
  }

  /**
   * Get current vocabulary
   */
  getVocabulary(): string[] {
    return [...this.vocabulary];
  }

  async transcribeFile(filePath: string): Promise<string> {
    // Verify file exists
    if (!existsSync(filePath)) {
      throw new TranscriptionError(
        `Audio file not found: ${filePath}`,
        ErrorCode.TRANSCRIPTION_FILE_NOT_FOUND,
        false
      );
    }

    // Check file size and split if needed
    const fileStats = statSync(filePath);
    if (needsSplit(fileStats.size)) {
      const buffer = readFileSync(filePath);
      return this.transcribeWithSplit(buffer);
    }

    try {
      const response = await withRetry(
        () =>
          this.client.audio.transcriptions.create({
            file: createReadStream(filePath),
            model: this.model,
            language: this.language,
            ...(this.vocabulary.length > 0 && {
              prompt: this.vocabulary.join(', '),
            }),
          }),
        {
          maxAttempts: 3,
          baseDelayMs: 1000,
          onRetry: (error, attempt) => {
            console.error(
              `[Transcription] Retry ${attempt}: ${error.message}`
            );
          },
        }
      );

      return response.text;
    } catch (error) {
      // Don't wrap TranscriptionError
      if (error instanceof TranscriptionError) {
        throw error;
      }

      const originalError = error instanceof Error ? error : undefined;
      const errorCode = detectErrorCode(error);

      // Retry with split on 413 error
      if (errorCode === ErrorCode.TRANSCRIPTION_FILE_TOO_LARGE) {
        const buffer = readFileSync(filePath);
        return this.transcribeWithSplit(buffer);
      }

      throw new TranscriptionError(
        `Transcription failed: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.TRANSCRIPTION_FAILED,
        true,
        originalError
      );
    }
  }

  async transcribeBuffer(
    buffer: Buffer,
    filename = 'audio.wav'
  ): Promise<string> {
    // Check buffer size and split if needed
    if (needsSplit(buffer.length)) {
      return this.transcribeWithSplit(buffer);
    }

    try {
      return await this.transcribeSingleBuffer(buffer, filename);
    } catch (error) {
      // Don't wrap TranscriptionError
      if (error instanceof TranscriptionError) {
        throw error;
      }

      const originalError = error instanceof Error ? error : undefined;
      const errorCode = detectErrorCode(error);

      // Retry with split on 413 error
      if (errorCode === ErrorCode.TRANSCRIPTION_FILE_TOO_LARGE) {
        return this.transcribeWithSplit(buffer);
      }

      throw new TranscriptionError(
        `Transcription failed: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.TRANSCRIPTION_FAILED,
        true,
        originalError
      );
    }
  }

  /**
   * Transcribe a single buffer without splitting
   */
  private async transcribeSingleBuffer(
    buffer: Buffer,
    filename = 'audio.wav'
  ): Promise<string> {
    // Create a Blob from buffer (cast to handle ArrayBufferLike vs ArrayBuffer)
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;
    const uint8Array = new Uint8Array(arrayBuffer);
    const blob = new Blob([uint8Array], { type: 'audio/wav' });
    const file = new File([blob], filename, { type: 'audio/wav' });

    const response = await withRetry(
      () =>
        this.client.audio.transcriptions.create({
          file,
          model: this.model,
          language: this.language,
          ...(this.vocabulary.length > 0 && {
            prompt: this.vocabulary.join(', '),
          }),
        }),
      {
        maxAttempts: 3,
        baseDelayMs: 1000,
        onRetry: (error, attempt) => {
          console.error(`[Transcription] Retry ${attempt}: ${error.message}`);
        },
      }
    );

    return response.text;
  }

  /**
   * Split buffer into chunks and transcribe each
   */
  private async transcribeWithSplit(buffer: Buffer): Promise<string> {
    // Use VAD-based splitting if enabled
    const chunks = this.useVad
      ? splitWavBufferWithVad(buffer)
      : (await import('./audio-splitter.js')).splitWavBuffer(buffer);

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

      // Use overlap-aware merging for VAD-split chunks
      return this.useVad
        ? mergeTranscriptionsWithOverlap(transcriptions)
        : (await import('./audio-splitter.js')).mergeTranscriptions(transcriptions);
    } catch (error) {
      // Wrap errors from chunk transcription
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
}

/**
 * Legacy WhisperAdapter for backward compatibility
 * @deprecated Use OpenAIWhisperAdapter instead
 */
export class WhisperAdapter extends OpenAIWhisperAdapter {
  constructor(apiKey: string) {
    super({ apiKey });
  }
}
