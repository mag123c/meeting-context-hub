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

## Doc Update Checklist (MUST)
| 변경 | 대상 | 필수 |
|------|------|------|
| 아키텍처 | architecture.md | 구조 변경 시 |
| 컨벤션 | conventions.md | 새 패턴 시 |
| **결정사항** | **.dev/DECISIONS.md** | **새 기능/설계 시** |

**DECISIONS.md 기록 (필수 체크)**:
- [ ] 새 기능 구현 → 결정 배경, 대안, 이유 기록
- [ ] PLAN과 실제 구현 차이 → `**구현 노트**` 추가
- [ ] 새로운 패턴/컨벤션 → conventions.md도 업데이트

## Commit
```
{type}({scope}): {summary}
```
No Co-Authored-By markers.

## Rules
- 테이블 > 산문
- 핵심만, 라인수 최소화
