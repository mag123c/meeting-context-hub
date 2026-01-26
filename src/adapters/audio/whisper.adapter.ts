import OpenAI from 'openai';
import { createReadStream, existsSync } from 'fs';
import {
  TranscriptionError,
  ErrorCode,
  detectErrorCode,
} from '../../types/errors.js';
import { withRetry } from '../../core/services/retry.service.js';

/**
 * Transcription provider interface
 */
export interface TranscriptionProvider {
  /**
   * Transcribe audio file to text
   */
  transcribeFile(filePath: string): Promise<string>;

  /**
   * Transcribe audio buffer to text
   */
  transcribeBuffer(buffer: Buffer, filename?: string): Promise<string>;
}

/**
 * OpenAI Whisper adapter for audio transcription
 */
export class WhisperAdapter implements TranscriptionProvider {
  private client: OpenAI;
  private model = 'whisper-1';

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
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

    try {
      const response = await withRetry(
        () =>
          this.client.audio.transcriptions.create({
            file: createReadStream(filePath),
            model: this.model,
            language: 'ko', // Korean language hint
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

      throw new TranscriptionError(
        `Transcription failed: ${originalError?.message ?? 'Unknown error'}`,
        errorCode === ErrorCode.AI_RATE_LIMITED
          ? ErrorCode.TRANSCRIPTION_FAILED
          : ErrorCode.TRANSCRIPTION_FAILED,
        true,
        originalError
      );
    }
  }

  async transcribeBuffer(
    buffer: Buffer,
    filename = 'audio.wav'
  ): Promise<string> {
    try {
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
            language: 'ko',
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

      throw new TranscriptionError(
        `Transcription failed: ${originalError?.message ?? 'Unknown error'}`,
        errorCode === ErrorCode.AI_RATE_LIMITED
          ? ErrorCode.TRANSCRIPTION_FAILED
          : ErrorCode.TRANSCRIPTION_FAILED,
        true,
        originalError
      );
    }
  }
}
