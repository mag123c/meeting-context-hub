---
name: next
description: 세션 시작 - 진행 상태 파악, 다음 작업 제시
required_context:
  - .claude/ai-context/architecture.md
---

# Next

## Flow
```
Read Planning → Git Log → Analyze → Present → Suggest /clarify
```

## Execution
1. **Read Planning**: docs/planning/*.md, PLAN.md 체크
2. **Git Log**: `git log --oneline -5`, `git status --short`
3. **Analyze**: 현재 Phase, 완료/전체 태스크
4. **Present**: 테이블 형식
5. **Suggest**: 다음 태스크 + `/clarify` 제안

## Output Format
```markdown
## Current Status
- Phase: {current_phase}
- Progress: {completed}/{total} tasks

## Next Task
**{task_name}**
{brief_description}

## Action
Run `/clarify` to start: {task_summary}
```

## Rules
- planning 파일 없으면 git log + 코드 상태로 추론
- 간결하게 출력 (5-10줄)
- 항상 /clarify 연결 제안
