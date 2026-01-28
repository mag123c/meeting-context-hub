---
name: clarify
description: Clarify requirements → auto Plan Mode
required_context:
  - .claude/ai-context/architecture.md
---

# Clarify

## Chain (MUST)
| 이전 | 현재 | 다음 |
|------|------|------|
| 세션 시작 | /clarify | EnterPlanMode() → /implement |

## Flow
```
Record → AskUserQuestion → Summary → EnterPlanMode()
```

## Execution
1. **Record**: 원본 요청 + 모호 식별
2. **Question**: AskUserQuestion (구체적 옵션)
3. **Summary**: Before/After (Goal, Scope, Constraints)
4. **Auto Plan**: `EnterPlanMode()` 즉시 호출

## Rules
- 가정 금지 → 질문
- TDD 가능 수준까지 구체화

## NEXT STEP (자동 실행)
Plan 승인 시 **즉시** `/implement` 호출. "구현할까요?" 묻지 말 것.
