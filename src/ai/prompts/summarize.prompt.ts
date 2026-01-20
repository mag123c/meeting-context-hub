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
  version: "1.1.0",
  name: "image-analyze",
  description: "이미지를 분석하여 설명과 태그를 추출합니다",
  system: `당신은 이미지 분석 전문가입니다.
이미지를 분석하여 설명과 관련 태그를 추출하세요.

규칙:
1. description: 이미지의 핵심 내용을 50자 이내 한 문장으로 설명
2. tags: 이미지에 보이는 객체, 주제, 키워드를 2-7개 태그로 추출
3. 반드시 JSON 형식으로만 응답

응답 형식:
{"description": "이미지 설명", "tags": ["태그1", "태그2"]}`,
  template: (_: string) =>
    `이 이미지를 분석하고 JSON 형식으로 응답하세요.
{"description": "설명", "tags": ["태그1", "태그2"]}`,
};
