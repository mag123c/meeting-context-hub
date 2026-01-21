import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import type { Prompt } from "../../types/prompt.types.js";
import type { ILLMClient } from "../interfaces/index.js";
import { AI_CONFIG } from "../../config/constants.js";
import { AIClientError } from "../../errors/index.js";

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Anthropic.APIError) {
    // Retry on rate limits (429) and server errors (5xx)
    return error.status === 429 || (error.status >= 500 && error.status < 600);
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

export class ClaudeClient implements ILLMClient {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
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
        lastError = error instanceof Error ? error : new Error(String(error));

        if (!isRetryableError(error) || attempt === MAX_RETRIES) {
          // Not retryable or final attempt - throw
          throw new AIClientError(
            `${context}: ${lastError.message}`,
            "claude"
          );
        }

        // Calculate backoff with exponential increase and jitter
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 500;
        await sleep(backoff + jitter);
      }
    }

    // Should never reach here, but TypeScript needs this
    throw new AIClientError(
      `${context}: ${lastError?.message ?? "Unknown error"}`,
      "claude"
    );
  }

  async complete(prompt: Prompt, input: string): Promise<string> {
    return this.withRetry(async () => {
      const message = await this.client.messages.create({
        model: AI_CONFIG.DEFAULT_MODEL,
        max_tokens: AI_CONFIG.MAX_TOKENS,
        system: prompt.system,
        messages: [
          { role: "user", content: prompt.template(input) },
        ],
      });

      const textBlock = message.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text response from Claude");
      }
      return textBlock.text;
    }, "Claude completion");
  }

  async analyzeImage(prompt: Prompt, imagePath: string): Promise<string> {
    const imageData = await readFile(imagePath);
    const base64 = imageData.toString("base64");
    const mediaType = this.getMediaType(imagePath);

    return this.withRetry(async () => {
      const message = await this.client.messages.create({
        model: AI_CONFIG.DEFAULT_MODEL,
        max_tokens: AI_CONFIG.MAX_TOKENS,
        system: prompt.system,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64,
                },
              },
              { type: "text", text: prompt.template("") },
            ],
          },
        ],
      });

      const textBlock = message.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text response from Claude");
      }
      return textBlock.text;
    }, "Claude image analysis");
  }

  private getMediaType(path: string): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
    const ext = path.toLowerCase().split(".").pop();
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      case "webp":
        return "image/webp";
      default:
        return "image/png";
    }
  }
}
