---
name: wrap
description: 세션 종료 - 문서 업데이트, 커밋
required_context:
  - .claude/ai-context/architecture.md
---

# Wrap

## Chain (MUST - 종료)
| 이전 | 현재 | 다음 |
|------|------|------|
| /review PASS | /wrap | 세션 완료 |

## Flow
```
Git Status → Doc Check → User Selection → Execute
```

## Doc Update
| 변경 | 대상 |
|------|------|
| 아키텍처 | architecture.md |
| 컨벤션 | conventions.md |

## Commit
```
{type}({scope}): {summary}
```
No Co-Authored-By markers.

## Rules
- 테이블 > 산문
- 핵심만, 라인수 최소화
