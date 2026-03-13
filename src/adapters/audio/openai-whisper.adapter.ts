/**
 * OpenAI Whisper Adapter
 *
 * Uses OpenAI's Whisper API for audio transcription
 */

import OpenAI, { toFile } from 'openai';
import { createReadStream, existsSync, readFileSync, writeFileSync, statSync, unlinkSync, openSync, readSync, closeSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import {
  TranscriptionError,
  ErrorCode,
  detectErrorCode,
} from '../../types/errors.js';
import { withRetry } from '../../core/services/retry.service.js';
import type { TranscriptionProvider, TranscriptionOptions, TranscriptionProgressCallback } from './whisper.types.js';
import {
  needsSplit,
  splitWavBufferWithVad,
  mergeTranscriptionsWithOverlap,
} from './audio-splitter.js';
import { isWavFormat, detectAudioFormat, getMimeType } from './audio-format.js';
import { convertToWav } from './ffmpeg-converter.js';

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

  async transcribeFile(filePath: string, options?: TranscriptionOptions): Promise<string> {
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
      // Read a small header to detect format
      const headerBuf = Buffer.alloc(12);
      const fd = openSync(filePath, 'r');
      readSync(fd, headerBuf, 0, 12, 0);
      closeSync(fd);

      if (isWavFormat(headerBuf)) {
        // WAV — use existing splitter directly
        const buffer = readFileSync(filePath);
        return this.transcribeWithSplit(buffer, options?.onProgress);
      }

      // Non-WAV — convert to WAV via ffmpeg, then split
      return this.transcribeNonWavWithConversion(filePath, options?.onProgress);
    }

    try {
      options?.onProgress?.({ currentChunk: 1, totalChunks: 1, percent: 0 });
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

      options?.onProgress?.({ currentChunk: 1, totalChunks: 1, percent: 100 });
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
        const headerBuf = buffer.slice(0, 12);
        if (isWavFormat(headerBuf)) {
          return this.transcribeWithSplit(buffer, options?.onProgress);
        }
        return this.transcribeNonWavWithConversion(filePath, options?.onProgress);
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
    filename = 'audio.wav',
    options?: TranscriptionOptions,
  ): Promise<string> {
    // Check buffer size and split if needed
    if (needsSplit(buffer.length)) {
      if (isWavFormat(buffer)) {
        return this.transcribeWithSplit(buffer, options?.onProgress);
      }
      // Non-WAV buffer — write to temp, convert via ffmpeg, split
      return this.transcribeNonWavBufferWithConversion(buffer, options?.onProgress);
    }

    try {
      options?.onProgress?.({ currentChunk: 1, totalChunks: 1, percent: 0 });
      const result = await this.transcribeSingleBuffer(buffer, filename);
      options?.onProgress?.({ currentChunk: 1, totalChunks: 1, percent: 100 });
      return result;
    } catch (error) {
      // Don't wrap TranscriptionError
      if (error instanceof TranscriptionError) {
        throw error;
      }

      const originalError = error instanceof Error ? error : undefined;
      const errorCode = detectErrorCode(error);

      // Retry with split on 413 error
      if (errorCode === ErrorCode.TRANSCRIPTION_FILE_TOO_LARGE) {
        if (isWavFormat(buffer)) {
          return this.transcribeWithSplit(buffer, options?.onProgress);
        }
        return this.transcribeNonWavBufferWithConversion(buffer, options?.onProgress);
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
    const format = detectAudioFormat(buffer);
    const mimeType = getMimeType(format);
    const file = await toFile(buffer, filename, { type: mimeType });

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
   * Convert non-WAV file to WAV via ffmpeg, then split and transcribe
   */
  private async transcribeNonWavWithConversion(
    filePath: string,
    onProgress?: TranscriptionProgressCallback,
  ): Promise<string> {
    let wavPath: string | null = null;
    try {
      onProgress?.({ currentChunk: 0, totalChunks: 1, percent: 0 });
      wavPath = await convertToWav(filePath);
      const wavBuffer = readFileSync(wavPath);
      return this.transcribeWithSplit(wavBuffer, onProgress);
    } finally {
      if (wavPath && existsSync(wavPath)) {
        try { unlinkSync(wavPath); } catch { /* ignore */ }
      }
    }
  }

  /**
   * Convert non-WAV buffer to WAV via ffmpeg, then split and transcribe
   */
  private async transcribeNonWavBufferWithConversion(
    buffer: Buffer,
    onProgress?: TranscriptionProgressCallback,
  ): Promise<string> {
    const tempInput = join(tmpdir(), `mch-input-${randomUUID()}.bin`);
    let wavPath: string | null = null;
    try {
      writeFileSync(tempInput, buffer);
      onProgress?.({ currentChunk: 0, totalChunks: 1, percent: 0 });
      wavPath = await convertToWav(tempInput);
      const wavBuffer = readFileSync(wavPath);
      return this.transcribeWithSplit(wavBuffer, onProgress);
    } finally {
      if (existsSync(tempInput)) {
        try { unlinkSync(tempInput); } catch { /* ignore */ }
      }
      if (wavPath && existsSync(wavPath)) {
        try { unlinkSync(wavPath); } catch { /* ignore */ }
      }
    }
  }

  /**
   * Split buffer into chunks and transcribe each
   */
  private async transcribeWithSplit(
    buffer: Buffer,
    onProgress?: TranscriptionProgressCallback,
  ): Promise<string> {
    // Use VAD-based splitting if enabled
    const chunks = this.useVad
      ? splitWavBufferWithVad(buffer)
      : (await import('./audio-splitter.js')).splitWavBuffer(buffer);

    const transcriptions: string[] = [];

    onProgress?.({ currentChunk: 0, totalChunks: chunks.length, percent: 0 });

    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const text = await this.transcribeSingleBuffer(
          chunk,
          `chunk-${i + 1}.wav`
        );
        transcriptions.push(text);
        onProgress?.({
          currentChunk: i + 1,
          totalChunks: chunks.length,
          percent: Math.round(((i + 1) / chunks.length) * 100),
        });
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
        '오디오 파일 분할 변환에 실패했습니다. MP3로 변환 후 다시 시도해주세요.',
        ErrorCode.TRANSCRIPTION_SPLIT_FAILED,
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
