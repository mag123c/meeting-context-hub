import { resolve } from "path";
import type { CreateContextInput } from "../types/context.types.js";
import { WhisperClient } from "../ai/clients/whisper.client.js";
import { validateFile } from "../utils/index.js";
import { validateAudioFile } from "../utils/preflight/index.js";
import { PreflightError } from "../errors/index.js";

export class AudioHandler {
  constructor(private whisper: WhisperClient) {}

  async handle(audioPath: string): Promise<CreateContextInput> {
    const absolutePath = resolve(audioPath);

    // Run preflight validation (size, permissions, format)
    const preflightResult = validateAudioFile(audioPath);
    if (!preflightResult.valid) {
      throw new PreflightError(preflightResult, "audio transcription");
    }

    // Legacy validation for extension check
    const validation = validateFile(audioPath, "audio");
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const transcription = await this.whisper.transcribe(absolutePath);

    return {
      type: "audio",
      content: transcription,
      source: absolutePath,
    };
  }
}
