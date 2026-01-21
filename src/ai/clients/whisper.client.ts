import OpenAI from "openai";
import { createReadStream } from "fs";
import type { ITranscriptionClient } from "../interfaces/index.js";

export interface WhisperConfig {
  apiKey: string;
  /**
   * Language code for transcription.
   * If undefined, Whisper will auto-detect the language.
   * Common values: "ko" (Korean), "en" (English), "ja" (Japanese), etc.
   */
  language?: string;
}

export class WhisperClient implements ITranscriptionClient {
  private client: OpenAI;
  private language?: string;

  constructor(config: WhisperConfig | string) {
    // Support both string (legacy) and config object
    if (typeof config === "string") {
      this.client = new OpenAI({ apiKey: config });
      this.language = undefined; // Auto-detect by default for legacy
    } else {
      this.client = new OpenAI({ apiKey: config.apiKey });
      this.language = config.language;
    }
  }

  async transcribe(audioPath: string): Promise<string> {
    const response = await this.client.audio.transcriptions.create({
      file: createReadStream(audioPath),
      model: "whisper-1",
      // Only include language if specified (undefined = auto-detect)
      ...(this.language && { language: this.language }),
    });
    return response.text;
  }

  /**
   * Set language for transcription
   */
  setLanguage(language: string | undefined): void {
    this.language = language;
  }

  /**
   * Get current language setting
   */
  getLanguage(): string | undefined {
    return this.language;
  }
}
