import OpenAI from 'openai';
import {
  EmbeddingError,
  ErrorCode,
  detectErrorCode,
} from '../../types/errors.js';
import { withRetry } from '../../core/services/retry.service.js';

/**
 * Embedding provider interface
 */
export interface EmbeddingProvider {
  /**
   * Generate embedding for text
   */
  embed(text: string): Promise<Float32Array>;

  /**
   * Generate embeddings for multiple texts
   */
  embedBatch(texts: string[]): Promise<Float32Array[]>;
}

/**
 * OpenAI embedding adapter
 */
export class OpenAIAdapter implements EmbeddingProvider {
  private client: OpenAI;
  private model = 'text-embedding-3-small';

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async embed(text: string): Promise<Float32Array> {
    const result = await this.embedBatch([text]);
    return result[0];
  }

  async embedBatch(texts: string[]): Promise<Float32Array[]> {
    if (texts.length === 0) {
      return [];
    }

    // OpenAI embedding API has a limit of 8191 tokens per input
    // Truncate texts to ~8000 characters to be safe
    const MAX_CHARS = 8000;
    const truncatedTexts = texts.map((text) =>
      text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text
    );

    try {
      const response = await withRetry(
        () =>
          this.client.embeddings.create({
            model: this.model,
            input: truncatedTexts,
          }),
        {
          maxAttempts: 3,
          baseDelayMs: 1000,
          onRetry: (error, attempt) => {
            console.error(
              `[Embedding] Retry ${attempt}: ${error.message}`
            );
          },
        }
      );

      return response.data.map((item) => new Float32Array(item.embedding));
    } catch (error) {
      const originalError = error instanceof Error ? error : undefined;
      const errorCode = detectErrorCode(error);

      // Map to specific embedding error codes
      const code =
        errorCode === ErrorCode.AI_RATE_LIMITED
          ? ErrorCode.EMBEDDING_RATE_LIMITED
          : ErrorCode.EMBEDDING_FAILED;

      throw new EmbeddingError(
        `Failed to generate embeddings: ${originalError?.message ?? 'Unknown error'}`,
        code,
        true,
        originalError
      );
    }
  }
}
