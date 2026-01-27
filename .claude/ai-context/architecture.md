# Architecture

## Layers
```
TUI[ink] → UseCases → Services → Adapters[AI/DB]
```

## Paths
| Layer | Path | Contents |
|-------|------|----------|
| TUI | src/tui/ | App, screens/, components/, hooks/ |
| UseCases | src/core/usecases/ | add-context, search, list, manage |
| Services | src/core/services/ | extract, embedding, chain, config, retry |
| Domain | src/core/domain/ | context, project |
| Adapters | src/adapters/ | ai/, audio/, storage/, config/ |
| i18n | src/i18n/ | t(), ti(), ~100 strings |

## Data Flow
```
1. TUI → UseCase
2. UseCase → Service (AI extract, embedding)
3. Service → Adapter (Claude, OpenAI, SQLite)
4. UseCase → ChainService (find related)
5. Return → TUI
```

## Error System
| Class | Purpose |
|-------|---------|
| MCHError | Base (code, recoverable, originalError) |
| AIError | Extraction failures |
| EmbeddingError | Vector generation |
| StorageError | Database ops |
| ConfigError | Missing keys |
| InputError | Validation |

## Deps
```
runtime: @anthropic-ai/sdk, openai, better-sqlite3, ink, react, zod
dev: typescript, vitest, eslint
```

## Dev Workflow
```
/clarify → Plan Mode → /implement (TDD) → /verify → /review → /wrap
```

## Skills
| Skill | Purpose |
|-------|---------|
| /clarify | Requirements → auto Plan Mode |
| /implement | TDD (RED→GREEN→REFACTOR) → /verify → /review |
| /verify | Self-healing test/build/lint |
| /review | Negative perspective review |
| /wrap | Session wrap-up |
| /next | Session start status |
