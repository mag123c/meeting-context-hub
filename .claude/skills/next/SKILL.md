---
name: next
description: 세션 시작 - 진행 상태 파악, 다음 작업 제시
required_context:
  - .claude/ai-context/architecture.md
---

# Next

## Position
체인 외부. 세션 시작 시 상태 확인용.
/next 완료 후 /clarify로 체인 진입 제안.

## Flow
```
Read Planning → Git Log → Analyze → Suggest /clarify
```

## Execution
1. **Read**: docs/planning/*.md, PLAN.md
2. **Git**: `git log --oneline -5`, `git status --short`
3. **Analyze**: Phase, 완료/전체
4. **Suggest**: `/clarify` 제안

## Output
```markdown
## Status: {phase} ({done}/{total})
## Next: {task}
## Action: /clarify {summary}
```

## Rules
- planning 없으면 git log로 추론
- 5-10줄
- 항상 /clarify 연결
