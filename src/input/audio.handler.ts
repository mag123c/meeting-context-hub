import { existsSync } from "fs";
import { resolve } from "path";
import type { CreateContextInput } from "../types/context.types.js";
import { WhisperClient } from "../ai/clients/whisper.client.js";

const SUPPORTED_EXTENSIONS = [".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm"];

export class AudioHandler {
  constructor(private whisper: WhisperClient) {}

  async handle(audioPath: string): Promise<CreateContextInput> {
    const absolutePath = resolve(audioPath);
    
    if (!existsSync(absolutePath)) {
      throw new Error("Audio file not found: " + absolutePath);
    }

    const ext = absolutePath.toLowerCase().split(".").pop();
    if (!ext || !SUPPORTED_EXTENSIONS.includes("." + ext)) {
      throw new Error("Unsupported audio format. Supported: " + SUPPORTED_EXTENSIONS.join(", "));
    }

    const transcription = await this.whisper.transcribe(absolutePath);

    return {
      type: "audio",
      content: transcription,
      source: absolutePath,
    };
  }
}
