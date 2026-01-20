import type { Prompt } from "../../types/prompt.types.js";

/**
 * LLM Client 인터페이스
 * 텍스트 완성 및 이미지 분석 기능 제공
 */
export interface ILLMClient {
  complete(prompt: Prompt, input: string): Promise<string>;
  analyzeImage(prompt: Prompt, imagePath: string): Promise<string>;
}

/**
 * Embedding Client 인터페이스
 * 텍스트를 벡터로 변환
 */
export interface IEmbeddingClient {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

/**
 * Transcription Client 인터페이스
 * 음성을 텍스트로 변환
 */
export interface ITranscriptionClient {
  transcribe(audioPath: string): Promise<string>;
}
