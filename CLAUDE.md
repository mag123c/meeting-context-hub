# Meeting Context Hub

TUI context tool. Input → AI extract → embedding chain.

## Quick Start
```bash
export ANTHROPIC_API_KEY=sk-ant-xxx
export OPENAI_API_KEY=sk-xxx
pnpm install && pnpm dev
```

## Context
| File | Content |
|------|---------|
| `.claude/ai-context/architecture.md` | Layers, data flow, deps |
| `.claude/ai-context/conventions.md` | TDD, naming, commits |

## Workflow

### 코드 구현 작업
```
/clarify → Plan Mode → /implement → /verify → /review → /wrap
```
각 단계 완료 후 즉시 다음 호출. 확인 묻지 말 것.

### 문서/설정 작업
```
Plan Mode (선택) → 직접 작업
```
코드가 아닌 작업은 /implement 없이 진행 가능.

## Commands
```bash
pnpm dev      # Dev
pnpm test     # Test
pnpm lint     # Lint
```

## Requirements
- Node.js 20+, sox
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
