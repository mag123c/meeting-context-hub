import type { Prompt } from "../../types/prompt.types.js";

/**
 * LLM Client interface
 * Provides text completion and image analysis
 */
export interface ILLMClient {
  complete(prompt: Prompt, input: string): Promise<string>;
  analyzeImage(prompt: Prompt, imagePath: string): Promise<string>;
}

/**
 * Embedding Client interface
 * Converts text to vectors
 */
export interface IEmbeddingClient {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

/**
 * Transcription Client interface
 * Converts speech to text
 */
export interface ITranscriptionClient {
  transcribe(audioPath: string): Promise<string>;
}
