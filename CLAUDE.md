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

## Dev Workflow (MUST FOLLOW)
```
/next → /clarify → Plan Mode → /implement → /verify → /review → /wrap
```

## Skill Chain (ENFORCED)
| 완료 단계 | 다음 호출 | 확인 필요 |
|-----------|----------|----------|
| Plan 승인 | `/implement` | NO |
| `/implement` | `/verify` | NO |
| `/verify` PASS | `/review` | NO |
| `/review` PASS | `/wrap` | NO |

**CRITICAL: 각 단계 완료 후 "다음 단계?" 묻지 말 것. 즉시 호출.**

## Commands
```bash
pnpm dev         # Dev
pnpm build       # Build
pnpm test        # Test
pnpm lint        # Lint
pnpm verify:core # Core isolation check
```

## Config
```bash
# Required
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx

# Optional
MCH_DB_PATH=~/.mch/data.db
MCH_LANGUAGE=en|ko
MCH_CONTEXT_LANGUAGE=en|ko
EDITOR=nano
```

## Requirements
- Node.js 20+
- Build tools: macOS `xcode-select --install` | Linux `build-essential`
- sox: `brew install sox`
