---
name: verify
description: Self-healing verification loop (test → build → lint)
required_context: []
---

# Verify

## Chain (MUST)
| 이전 | 현재 | 다음 (자동) |
|------|------|-------------|
| /implement | /verify | /review (통과 시 즉시) |

## Flow
```
pnpm test → pnpm build → pnpm lint → /review
    │           │            │
    └── 실패 시 수정 후 재검증 (3회 시 알림)
```

## Self-Healing
- 실패 → 분석 → 수정 → 재검증
- 3회 반복 시 사용자 알림

## NEXT STEP (자동 실행)
모두 통과 시 **즉시** `/review` 호출. "리뷰할까요?" 묻지 말 것.
