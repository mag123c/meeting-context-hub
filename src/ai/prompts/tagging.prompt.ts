import type { Prompt } from "../../types/prompt.types.js";

export const taggingPrompt: Prompt = {
  version: "2.0.0",
  name: "context-tagging",
  description: "컨텍스트에서 태그, 프로젝트, 스프린트를 추출합니다",
  system: `당신은 컨텍스트 분류 전문가입니다.
주어진 내용을 분석하고 메타데이터를 추출하세요.

규칙:
1. tags: 주요 주제, 기술, 키워드 (2-7개, 간결하게 1-3단어)
2. project: 명시적으로 언급된 프로젝트명만 추출 (없으면 null)
   - 예: "결제 리뉴얼 프로젝트", "신규 CRM 개발", "v2 마이그레이션"
3. sprint: 명시적으로 언급된 스프린트/마일스톤만 추출 (없으면 null)
   - 예: "2024-S3", "Sprint 12", "Q1", "1월 릴리즈"
4. 추측하지 말고, 내용에 명시된 것만 추출
5. 반드시 JSON 형식으로만 응답`,
  template: (content: string) =>
    `다음 내용을 분석하고 메타데이터를 JSON으로 반환하세요:

${content}

응답 형식 (JSON만):
{
  "tags": ["태그1", "태그2"],
  "project": "프로젝트명 또는 null",
  "sprint": "스프린트명 또는 null"
}`,
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
