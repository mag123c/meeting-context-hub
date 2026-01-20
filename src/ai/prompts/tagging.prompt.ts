import type { Prompt } from "../../types/prompt.types.js";

export const taggingPrompt: Prompt = {
  version: "1.0.0",
  name: "context-tagging",
  description: "컨텍스트에서 관련 태그를 추출합니다",
  system: `당신은 컨텍스트 분류 전문가입니다.
주어진 내용을 분석하고 관련 태그를 추출하세요.

규칙:
1. 태그는 간결하고 명확해야 합니다 (1-3단어)
2. 주요 주제, 기술, 인물, 프로젝트명을 태그로 추출
3. 최소 2개, 최대 7개의 태그 반환
4. 태그는 소문자, 한글, 영문 허용
5. 반드시 JSON 배열 형식으로만 응답`,
  template: (content: string) =>
    `다음 내용을 분석하고 관련 태그를 JSON 배열로 반환하세요:

${content}

응답 형식 (JSON 배열만): ["태그1", "태그2", ...]`,
};

export const imageTaggingPrompt: Prompt = {
  version: "1.0.0",
  name: "image-tagging",
  description: "이미지에서 태그를 추출합니다",
  system: `당신은 이미지 분석 및 분류 전문가입니다.
이미지를 분석하고 관련 태그를 추출하세요.

규칙:
1. 이미지에 보이는 객체, 텍스트, 주제를 태그로 추출
2. 최소 2개, 최대 7개의 태그 반환
3. 반드시 JSON 배열 형식으로만 응답`,
  template: (_: string) =>
    `이 이미지를 분석하고 관련 태그를 JSON 배열로 반환하세요.

응답 형식 (JSON 배열만): ["태그1", "태그2", ...]`,
};
