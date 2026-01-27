---
name: wrap
description: 세션 종료 - 문서 업데이트, 커밋
required_context:
  - .claude/ai-context/architecture.md
---

# Wrap

## Flow
```
Git Status → Doc Check → User Selection → Execute
```

## Execution
1. **Git Status**
   ```bash
   git status --short
   git diff --stat HEAD~3
   ```

2. **Doc Check** (ai-context 규칙 준수)
   | 변경 | 대상 |
   |------|------|
   | 아키텍처 | architecture.md |
   | 컨벤션 | conventions.md |
   | 모듈 | CLAUDE.md (tui, core, i18n 등) |

3. **User Selection**: AskUserQuestion (문서만/커밋만/둘 다/건너뛰기)

4. **Execute**: 선택 항목 실행

## DSL Rules (ai-context)
- 테이블 > 산문
- 코드블록 > 설명
- 핵심만, 라인수 최소화

## Commit
```
{type}({scope}): {summary}
```
**Note: No Co-Authored-By markers**
