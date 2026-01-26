# Meeting Context Hub

TUI-based context management tool. Input discussions → AI extracts development artifacts (Decisions, Actions, Policies) → embedding-based context chaining.

## Quick Start

```bash
export ANTHROPIC_API_KEY=sk-ant-xxx
export OPENAI_API_KEY=sk-xxx
pnpm install && pnpm dev
```

## Architecture

```
┌─────────────┐
│     TUI     │  React + Ink
└──────┬──────┘
       │
┌──────▼──────┐
│  Use Cases  │  Business logic orchestration
└──────┬──────┘
       │
┌──────▼──────┐
│  Services   │  Domain logic (Extract, Embed, Chain)
└──────┬──────┘
       │
┌──────▼──────┐
│  Adapters   │  External integrations (Claude, OpenAI, SQLite)
└─────────────┘
```

## Directory Structure

```
src/
├── index.tsx           # Entry point
├── tui/                # TUI layer (screens, components, hooks)
├── core/               # Business logic (usecases, services, domain)
├── adapters/           # External dependencies (ai, storage, config)
├── i18n/               # Internationalization (t(), ti() helpers, ~95 strings)
└── types/              # Shared types + Error system (errors.ts)
```

## Development Style: TDD

All implementations follow **Test-Driven Development**:

```
1. RED    - Write failing test first
2. GREEN  - Write minimal code to pass
3. REFACTOR - Clean up (tests must stay green)
```

### Test File Locations

| Layer | Test Location | Example |
|-------|---------------|---------|
| Services | `src/core/services/*.test.ts` | `extract.service.test.ts` |
| UseCases | `src/core/usecases/*.test.ts` | `add-context.usecase.test.ts` |
| Adapters | `src/adapters/**/*.test.ts` | `claude.adapter.test.ts` |
| Components | `src/tui/components/*.test.tsx` | `ErrorDisplay.test.tsx` |

### TDD Principles

- **No implementation without test**: Write tests first for new features/bug fixes
- **Maintain test coverage**: Core logic (services, usecases) must have tests
- **Use mocks**: Isolate external dependencies (AI API, DB) with mocks

## Error Handling

Centralized error system:
- **MCHError** base class with `code`, `recoverable`, `originalError`
- **7 error types**: AIError, EmbeddingError, StorageError, TranscriptionError, RecordingError, ConfigError, InputError
- **28 error codes** in ErrorCode enum
- **Bilingual recovery messages** (ko/en)
- **Retry service** with exponential backoff

## Commands

```bash
pnpm dev         # Run TUI (development)
pnpm build       # Build for production
pnpm test        # Run tests
pnpm lint        # Lint check
pnpm verify:core # Verify core module has no UI imports
```

## Configuration

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-xxx   # Claude API
OPENAI_API_KEY=sk-xxx          # OpenAI (embedding, whisper)

# Optional (can also be changed in Settings screen)
MCH_DB_PATH=~/.mch/data.db     # Database location
MCH_LANGUAGE=ko                # UI language: 'ko' (Korean) or 'en' (English)
```

## Documentation

| Document | Description |
|----------|-------------|
| `docs/PRD.md` | Product requirements |
| `docs/ARCHITECTURE.md` | Architecture & technical design |
| `docs/ROADMAP.md` | Version-by-version implementation plan |
| `docs/GUI_INTEGRATION.md` | Guide for GUI integration with core module |

## AI Context

See `.claude/ai-context/` for detailed knowledge:

| File | Content |
|------|---------|
| `architecture.json` | Layer structure, dependencies |
| `conventions.json` | Naming, code style, TDD |
| `domain/context.json` | Domain entities, rules |

## Requirements

- **Node.js** 18+
- **sox** (for audio recording): `brew install sox`
- **Anthropic API Key** (required)
- **OpenAI API Key** (for embedding, whisper)
