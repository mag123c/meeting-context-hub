import { z } from "zod";
import type { PromptConfig } from "../claude";

export const prdOutputSchema = z.object({
  problem: z.string().describe("해결하려는 문제"),
  goal: z.string().describe("달성하려는 목표"),
  scope: z.array(z.string()).describe("범위 및 포함/제외 항목"),
  requirements: z.array(z.string()).describe("구체적 요구사항 목록"),
});

export const actionItemsOutputSchema = z.array(
  z.object({
    assignee: z.string().describe("담당자"),
    task: z.string().describe("할 일"),
    deadline: z.string().nullable().describe("기한"),
  })
);

export const meetingSummaryOutputSchema = z.object({
  prd: prdOutputSchema,
  actionItems: actionItemsOutputSchema,
  suggestedTags: z.array(z.string()).describe("추천 태그"),
});

export type MeetingSummaryOutput = z.infer<typeof meetingSummaryOutputSchema>;

export const MEETING_SUMMARY_PROMPT: PromptConfig<
  typeof meetingSummaryOutputSchema
> = {
  version: "1.0.0",
  model: "claude-sonnet-4-20250514",
  maxTokens: 4096,
  systemPrompt: `당신은 회의록 요약 전문가입니다. 회의록 텍스트를 분석하여 PRD(Product Requirements Document) 형식으로 요약하고, Action Items를 추출합니다.

## 출력 형식

반드시 아래 JSON 형식으로만 응답하세요:

\`\`\`json
{
  "prd": {
    "problem": "해결하려는 문제 요약",
    "goal": "달성하려는 목표",
    "scope": ["범위 항목 1", "범위 항목 2"],
    "requirements": ["요구사항 1", "요구사항 2"]
  },
  "actionItems": [
    {
      "assignee": "담당자 이름",
      "task": "할 일 내용",
      "deadline": "기한 (없으면 null)"
    }
  ],
  "suggestedTags": ["태그1", "태그2"]
}
\`\`\`

## 규칙

1. PRD 섹션:
   - problem: 회의에서 논의된 핵심 문제점
   - goal: 달성하고자 하는 목표
   - scope: 범위 (포함 사항, 제외 사항)
   - requirements: 구체적인 요구사항 목록

2. Action Items:
   - 명확한 담당자가 있는 경우만 추출
   - 담당자 불분명 시 "미정" 표시
   - 기한이 언급되지 않으면 null

3. 태그:
   - 프로젝트명, 기능명, 팀명 등 키워드 추출
   - 3-5개 추천`,
  outputSchema: meetingSummaryOutputSchema,
};
