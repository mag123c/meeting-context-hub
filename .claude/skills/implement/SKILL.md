---
name: implement
description: TDD implementation (RED→GREEN→REFACTOR) → verify → review
required_context:
  - .claude/ai-context/architecture.md
  - .claude/ai-context/conventions.md
---

# Implement

## Chain (MUST - 체인 컨트롤러)
| 이전 | 현재 | 다음 (자동) |
|------|------|-------------|
| Plan 승인 | /implement | /verify → /review → /wrap |

**CRITICAL: 구현 완료 후 "verify 할까요?" 묻지 말고 즉시 실행**

## Flow
```
Analysis → TDD(RED→GREEN→REFACTOR) → /verify → /review → /wrap
```

## Execution
1. **Analysis**: Plan 확인, 브랜치 생성
2. **TDD**: RED → GREEN → REFACTOR
3. **Auto Chain**: /verify → /review → /wrap (자동 연속)

## Commands
```bash
pnpm test && pnpm build && pnpm lint
```

## Rules
- 테스트 없는 구현 금지
- verify 실패 시 수정 후 재검증
- 전체 체인 완료까지 사용자 확인 불필요
