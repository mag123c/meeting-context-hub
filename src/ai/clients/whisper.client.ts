import OpenAI from "openai";
import { createReadStream } from "fs";

export class WhisperClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async transcribe(audioPath: string): Promise<string> {
    const response = await this.client.audio.transcriptions.create({
      file: createReadStream(audioPath),
      model: "whisper-1",
      language: "ko", // 한국어 우선
    });
    return response.text;
  }
}
