---
name: review
description: 부정적 관점 코드 리뷰 (컨벤션, 품질, 버그, 성능)
required_context:
  - .claude/ai-context/architecture.md
  - .claude/ai-context/conventions.md
---

# Review

## Chain (MUST)
| 이전 | 현재 | 다음 (자동) |
|------|------|-------------|
| /verify | /review | /wrap (PASS 시 즉시) |

## Checklist
| Category | Items |
|----------|-------|
| Convention | CLAUDE.md 위반, 네이밍, 레이어 |
| Quality | 복잡성, 중복, 매직넘버 |
| Bugs | 엣지케이스, null, async |
| Tests | 누락 케이스, 경계값, 에러경로 |

## Output
```markdown
## Review Result
### Issues: [CRITICAL/WARNING/INFO] 내용
### Verdict: PASS | FAIL (이유)
```

## Rules
- 문제 찾기 목적 (칭찬 금지)
- FAIL 시 수정 후 /verify부터 재실행

## NEXT STEP (자동 실행)
PASS 시 **즉시** `/wrap` 호출. "wrap할까요?" 묻지 말 것.
