import { readFile } from "fs/promises";
import type { CreateMeetingInput } from "../types/meeting.types.js";
import { validateFile } from "../utils/index.js";

export async function handleMeetingInput(
  input: string
): Promise<CreateMeetingInput> {
  // 파일 경로인지 직접 텍스트인지 판단
  if (input.endsWith(".txt") || input.endsWith(".md")) {
    const validation = validateFile(input, "document");
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    const content = await readFile(validation.absolutePath, "utf-8");
    return {
      transcript: content,
      source: validation.absolutePath,
    };
  }

  // 직접 텍스트 입력
  return {
    transcript: input,
  };
}
