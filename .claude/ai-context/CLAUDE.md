# AI Context

Knowledge documents for Meeting Context Hub.

## Structure
```
ai-context/
├── architecture.md   # Layers, data flow, deps
├── conventions.md    # TDD, naming, errors, commits
└── CLAUDE.md         # This file
```

## Loading Rules
| Task | Load |
|------|------|
| All tasks | architecture.md |
| Writing code | + conventions.md |

## Core Principles
1. **TDD**: RED → GREEN → REFACTOR
2. **Clean Architecture**: tui → usecases → services → adapters
3. **Error Handling**: MCHError with codes

## Estimated Tokens
| File | Tokens |
|------|--------|
| architecture.md | ~400 |
| conventions.md | ~350 |
| **Total** | **~750** |
