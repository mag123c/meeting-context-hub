# Core Module

UI-agnostic business logic layer. Can be used by TUI, GUI, or CLI.

## Architecture

```
core/
├── domain/      # Entities (Context, Project, PromptContext)
├── services/    # Domain logic (Extract, Embed, Chain, Config, Dictionary, PromptContext)
├── usecases/    # Application logic orchestration
└── index.ts     # Public API exports
```

## Usage in GUI

See `docs/GUI_INTEGRATION.md` for detailed integration guide.

```typescript
import {
  AddContextUseCase,
  ListContextsUseCase,
  SearchContextUseCase,
  ConfigService,
} from 'meeting-context-hub/core';
```

## Key Services

| Service | Responsibility |
|---------|----------------|
| ExtractService | AI-based context extraction (supports language/domainContext options) |
| EmbeddingService | Vector embedding generation |
| ChainService | Cosine similarity for related contexts |
| ConfigService | Configuration management (language, contextLanguage, dbPath) |
| RetryService | Exponential backoff retry |
| PathCompletionService | Path expansion (~) and autocompletion |
| FileValidationService | Audio file existence and extension validation |
| DictionaryService | STT correction via source→target mappings (auto-applied in usecases) |
| PromptContextService | Domain knowledge management for AI prompt injection |

## Dependency Injection

Services receive adapters via constructor:

```typescript
const extractService = new ExtractService(aiAdapter);
const embeddingService = new EmbeddingService(embeddingAdapter);
```

## UI Independence

Core must not import React or Ink. Verify with:

```bash
pnpm verify:core
```

## Testing

Mock external adapters in tests:

```typescript
const mockAI = { extract: vi.fn() };
const service = new ExtractService(mockAI);
```
