import type { Prompt } from "../../types/prompt.types.js";

export const summarizePrompt: Prompt = {
  version: "1.0.0",
  name: "context-summarize",
  description: "컨텍스트를 한 줄로 요약합니다",
  system: `당신은 요약 전문가입니다.
주어진 내용을 핵심만 담아 한 문장으로 요약하세요.

규칙:
1. 50자 이내로 요약
2. 핵심 정보만 포함
3. 문장으로 끝내기 (마침표 포함)`,
  template: (content: string) =>
    `다음 내용을 한 문장으로 요약하세요:

${content}`,
};

export const imageSummarizePrompt: Prompt = {
  version: "1.0.0",
  name: "image-summarize",
  description: "이미지를 한 줄로 설명합니다",
  system: `당신은 이미지 분석 전문가입니다.
이미지의 내용을 한 문장으로 설명하세요.

규칙:
1. 50자 이내로 설명
2. 이미지의 핵심 내용 설명
3. 문장으로 끝내기 (마침표 포함)`,
  template: (_: string) =>
    `이 이미지를 한 문장으로 설명하세요.`,
};
