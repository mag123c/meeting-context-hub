import type { CreateContextInput } from "../types/context.types.js";
import { WhisperClient } from "../ai/clients/whisper.client.js";
import { validateFile } from "../utils/index.js";

export class AudioHandler {
  constructor(private whisper: WhisperClient) {}

  async handle(audioPath: string): Promise<CreateContextInput> {
    const validation = validateFile(audioPath, "audio");
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const transcription = await this.whisper.transcribe(validation.absolutePath);

    return {
      type: "audio",
      content: transcription,
      source: validation.absolutePath,
    };
  }
}
