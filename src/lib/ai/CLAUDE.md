# AI / Prompts

## 역할

Claude SDK 래퍼 및 프롬프트 관리

## 의존성

- `@anthropic-ai/sdk`
- `zod` (출력 검증)

## 파일 구조

| 파일 | 역할 |
|------|------|
| `claude.ts` | Claude SDK 초기화 및 래퍼 |
| `prompts/meeting-summary.prompt.ts` | 회의록 → PRD 프롬프트 |
| `prompts/context-tagging.prompt.ts` | 컨텍스트 → 태그 프롬프트 |
| `prompts/qa-search.prompt.ts` | Q&A 검색 프롬프트 |

## 규칙

1. **선언형 프롬프트**: 각 프롬프트 파일에 version 필드 필수
2. **Zod 출력 스키마**: 모든 프롬프트에 outputSchema 정의
3. **네이밍**: `{purpose}.prompt.ts`
4. **환경변수**: `ANTHROPIC_API_KEY` 필수

## 프롬프트 구조

```typescript
export const MEETING_SUMMARY_PROMPT = {
  version: "1.0.0",
  model: "claude-sonnet-4-20250514",
  maxTokens: 4096,
  systemPrompt: `...`,
  outputSchema: z.object({
    problem: z.string(),
    goal: z.string(),
    scope: z.array(z.string()),
    requirements: z.array(z.string()),
  }),
} as const;
```

## 버전 관리

- 프롬프트 변경 시 version 업데이트
- 주요 변경: major 버전 증가
- 미세 조정: minor/patch 버전 증가
