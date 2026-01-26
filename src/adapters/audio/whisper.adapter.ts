import OpenAI from 'openai';
import { createReadStream } from 'fs';

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
    const response = await this.client.audio.transcriptions.create({
      file: createReadStream(filePath),
      model: this.model,
      language: 'ko', // Korean language hint
    });

    return response.text;
  }

  async transcribeBuffer(buffer: Buffer, filename = 'audio.wav'): Promise<string> {
    // Create a Blob from buffer (cast to handle ArrayBufferLike vs ArrayBuffer)
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    const uint8Array = new Uint8Array(arrayBuffer);
    const blob = new Blob([uint8Array], { type: 'audio/wav' });
    const file = new File([blob], filename, { type: 'audio/wav' });

    const response = await this.client.audio.transcriptions.create({
      file,
      model: this.model,
      language: 'ko',
    });

    return response.text;
  }
}

/**
 * Transcription error
 */
export class TranscriptionError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'TranscriptionError';
  }
}
