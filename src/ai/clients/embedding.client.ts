import OpenAI from "openai";
import type { IEmbeddingClient } from "../interfaces/index.js";
import { AIClientError, TextLengthError, EmptyInputError } from "../../errors/index.js";

// OpenAI embedding limits
// text-embedding-3-small has 8192 token limit
// Korean text has ~1.5 chars per token (much denser than English ~4 chars/token)
const MAX_TOKENS = 7500; // Leave margin for safety
const CHARS_PER_TOKEN = 1.5; // Conservative for Korean/mixed content
const MAX_TEXT_LENGTH = Math.floor(MAX_TOKENS * CHARS_PER_TOKEN); // ~11250 chars
const MAX_BATCH_SIZE = 100; // Maximum texts per batch

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof OpenAI.APIError) {
    // Retry on rate limits (429) and server errors (5xx)
    return error.status === 429 || (error.status !== undefined && error.status >= 500 && error.status < 600);
  }
  // Retry on network errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("econnreset") ||
      message.includes("etimedout") ||
      message.includes("socket")
    );
  }
  return false;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class EmbeddingClient implements IEmbeddingClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Truncate text to fit within token limit
   * Preserves beginning of text (usually most relevant)
   */
  private truncateText(text: string): string {
    if (text.length <= MAX_TEXT_LENGTH) {
      return text;
    }
    // Truncate and add indicator
    return text.slice(0, MAX_TEXT_LENGTH - 3) + "...";
  }

  /**
   * Validate text input (after truncation)
   */
  private validateText(text: string, index?: number): void {
    const label = index !== undefined ? `Text at index ${index}` : "Text";

    if (!text || text.trim().length === 0) {
      throw new EmptyInputError(label.toLowerCase());
    }
  }

  /**
   * Execute an API call with retry logic
   */
  private async withRetry<T>(operation: () => Promise<T>, context: string): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        // Re-throw validation errors immediately (not retryable)
        if (error instanceof EmptyInputError || error instanceof TextLengthError) {
          throw error;
        }

        lastError = error instanceof Error ? error : new Error(String(error));

        if (!isRetryableError(error) || attempt === MAX_RETRIES) {
          throw new AIClientError(
            `${context}: ${lastError.message}`,
            "openai"
          );
        }

        // Exponential backoff with jitter
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 500;
        await sleep(backoff + jitter);
      }
    }

    throw new AIClientError(
      `${context}: ${lastError?.message ?? "Unknown error"}`,
      "openai"
    );
  }

  async embed(text: string): Promise<number[]> {
    const truncatedText = this.truncateText(text);
    this.validateText(truncatedText);

    return this.withRetry(async () => {
      const response = await this.client.embeddings.create({
        model: "text-embedding-3-small",
        input: truncatedText,
      });
      return response.data[0].embedding;
    }, "Embedding generation");
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      throw new EmptyInputError("text array");
    }

    if (texts.length > MAX_BATCH_SIZE) {
      throw new AIClientError(
        `Batch size ${texts.length} exceeds limit of ${MAX_BATCH_SIZE}`,
        "openai"
      );
    }

    // Truncate and validate all texts
    const truncatedTexts = texts.map((text) => this.truncateText(text));
    truncatedTexts.forEach((text, index) => this.validateText(text, index));

    return this.withRetry(async () => {
      const response = await this.client.embeddings.create({
        model: "text-embedding-3-small",
        input: truncatedTexts,
      });
      return response.data.map((d) => d.embedding);
    }, "Batch embedding generation");
  }
}
