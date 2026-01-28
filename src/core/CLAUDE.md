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

## UseCases

| UseCase | Responsibility |
|---------|----------------|
| AddContextUseCase | Create context from raw input (extract → embed → save) |
| ListContextsUseCase | List contexts with pagination |
| SearchContextUseCase | Semantic/keyword search |
| ManageContextUseCase | Update/delete context, change group |
| TranslateContextUseCase | Translate context content to ko/en (preview → apply) |
| GetContextUseCase | Get single context by ID |
| ManageProjectUseCase | CRUD for projects/groups |
| RecordContextUseCase | Audio recording → transcribe → extract |

## Usage in GUI

See `docs/GUI_INTEGRATION.md` for detailed integration guide.

```typescript
import {
  AddContextUseCase,
  ListContextsUseCase,
  SearchContextUseCase,
  TranslateContextUseCase,
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
| DictionaryService | STT correction via source→target mappings (supports projectId for group-specific) |
| PromptContextService | Domain knowledge management for AI prompt injection (supports projectId for group-specific) |

## Group-specific Settings

DictionaryService and PromptContextService support `projectId` parameter:

```typescript
// Global entries (projectId = null)
await dictionaryService.addEntry('AWS', 'Amazon Web Services');

// Group-specific entries (override global)
await dictionaryService.addEntry('AWS', 'Acme Web System', projectId);

// Merge: global + group-specific (group overrides global)
const text = await dictionaryService.correctText(input, projectId);
const domainContext = await promptContextService.getDomainContextForPrompt(projectId);
```

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
