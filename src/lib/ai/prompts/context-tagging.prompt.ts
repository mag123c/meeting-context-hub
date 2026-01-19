import { z } from "zod";
import type { PromptConfig } from "../claude";

export const contextTaggingOutputSchema = z.object({
  existingTags: z.array(z.string()).describe("재활용할 기존 태그"),
  newTags: z
    .array(
      z.object({
        name: z.string().describe("새 태그명"),
        description: z.string().describe("태그 설명"),
      })
    )
    .describe("새로 생성할 태그"),
  summary: z.string().describe("컨텍스트 한줄 요약"),
});

export type ContextTaggingOutput = z.infer<typeof contextTaggingOutputSchema>;

export const CONTEXT_TAGGING_PROMPT: PromptConfig<
  typeof contextTaggingOutputSchema
> = {
  version: "1.0.0",
  model: "claude-sonnet-4-20250514",
  maxTokens: 2048,
  systemPrompt: `당신은 컨텍스트 분류 전문가입니다. 주어진 텍스트를 분석하여 적절한 태그를 추천합니다.

## 입력

1. 컨텍스트 내용
2. 기존 태그 목록 (재활용 우선)

## 출력 형식

반드시 아래 JSON 형식으로만 응답하세요:

\`\`\`json
{
  "existingTags": ["재활용할 기존 태그1", "재활용할 기존 태그2"],
  "newTags": [
    {
      "name": "새태그명",
      "description": "이 태그의 의미"
    }
  ],
  "summary": "컨텍스트 한줄 요약"
}
\`\`\`

## 규칙

1. 기존 태그 우선:
   - 기존 태그 목록에서 적합한 태그 먼저 선택
   - 유사한 의미의 태그가 있으면 새로 만들지 않음

2. 새 태그 생성:
   - 정말 필요한 경우에만 생성
   - 태그명: 한글 가능, 공백 대신 하이픈 사용
   - description 필수

3. 태그 수:
   - 총 2-5개 추천
   - 너무 일반적인 태그 피하기 (예: "회의", "업무")`,
  outputSchema: contextTaggingOutputSchema,
};

export function buildContextTaggingPrompt(
  content: string,
  existingTags: string[]
): string {
  return `## 컨텍스트 내용
${content}

## 기존 태그 목록
${existingTags.length > 0 ? existingTags.join(", ") : "(없음)"}

위 컨텍스트에 적합한 태그를 추천해주세요.`;
}
