import { readFile } from "fs/promises";
import type { CreateMeetingInput } from "../types/meeting.types.js";

export async function handleMeetingInput(
  input: string
): Promise<CreateMeetingInput> {
  // 파일 경로인지 직접 텍스트인지 판단
  if (input.endsWith(".txt") || input.endsWith(".md")) {
    const content = await readFile(input, "utf-8");
    return {
      transcript: content,
      source: input,
    };
  }

  // 직접 텍스트 입력
  return {
    transcript: input,
  };
}
