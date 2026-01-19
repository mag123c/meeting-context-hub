import { z } from "zod";
import type { PromptConfig } from "../claude";

export const qaSearchOutputSchema = z.object({
  answer: z.string().describe("질문에 대한 답변"),
  sources: z
    .array(
      z.object({
        type: z.enum(["meeting", "context"]).describe("출처 타입"),
        id: z.string().describe("출처 ID"),
        relevance: z.string().describe("관련성 설명"),
      })
    )
    .describe("답변 근거 출처"),
  confidence: z
    .enum(["high", "medium", "low"])
    .describe("답변 신뢰도"),
});

export type QASearchOutput = z.infer<typeof qaSearchOutputSchema>;

export const QA_SEARCH_PROMPT: PromptConfig<typeof qaSearchOutputSchema> = {
  version: "1.0.0",
  model: "claude-sonnet-4-20250514",
  maxTokens: 4096,
  systemPrompt: `당신은 프로젝트 진행 상황을 파악하는 어시스턴트입니다. 주어진 회의록과 컨텍스트를 기반으로 질문에 답변합니다.

## 입력

1. 사용자 질문
2. 관련 회의록 목록
3. 관련 컨텍스트 목록

## 출력 형식

반드시 아래 JSON 형식으로만 응답하세요:

\`\`\`json
{
  "answer": "질문에 대한 상세 답변",
  "sources": [
    {
      "type": "meeting",
      "id": "회의록 ID",
      "relevance": "이 회의록이 답변에 어떻게 기여했는지"
    }
  ],
  "confidence": "high|medium|low"
}
\`\`\`

## 규칙

1. 답변:
   - 주어진 정보만 기반으로 답변
   - 추측하지 않음
   - 정보 부족 시 명시

2. 출처:
   - 답변에 사용한 모든 출처 명시
   - 각 출처의 관련성 설명

3. 신뢰도:
   - high: 명확한 정보가 있음
   - medium: 관련 정보는 있으나 직접적이지 않음
   - low: 추론에 의존`,
  outputSchema: qaSearchOutputSchema,
};

export function buildQASearchPrompt(
  question: string,
  meetings: Array<{ id: string; title: string; summary: string }>,
  contexts: Array<{ id: string; content: string; tags: string[] }>
): string {
  const meetingsText = meetings
    .map(
      (m) => `### 회의: ${m.title} (ID: ${m.id})
${m.summary}`
    )
    .join("\n\n");

  const contextsText = contexts
    .map(
      (c) => `### 컨텍스트 (ID: ${c.id})
태그: ${c.tags.join(", ")}
${c.content}`
    )
    .join("\n\n");

  return `## 질문
${question}

## 관련 회의록
${meetingsText || "(없음)"}

## 관련 컨텍스트
${contextsText || "(없음)"}

위 정보를 기반으로 질문에 답변해주세요.`;
}
