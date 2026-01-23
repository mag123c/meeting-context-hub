# AI Layer

LLM, embedding, and transcription client abstraction with prompt management.

## Structure

| Directory | Purpose |
|-----------|---------|
| `interfaces/` | AI client interfaces |
| `clients/` | Implementations (Claude, OpenAI, Whisper) |
| `prompts/` | Prompt templates with versioning |

## Prompts

| File | Purpose |
|------|---------|
| `tagging.prompt.ts` | Extract tags, project, sprint from content |
| `summarize.prompt.ts` | Generate content summary |
| `meeting-summary.prompt.ts` | Extract meeting summary, action items |
| `hierarchy-classification.prompt.ts` | Classify content into project/category |

## Interfaces

| Interface | Implementation | Purpose |
|-----------|----------------|---------|
| `ILLMClient` | `ClaudeClient` | Text completion, image analysis |
| `IEmbeddingClient` | `EmbeddingClient` | Text embeddings (OpenAI) |
| `ITranscriptionClient` | `WhisperClient` | Audio transcription (OpenAI) |

## Retry Logic

All AI clients implement exponential backoff retry:

| Config | Value |
|--------|-------|
| Max retries | 3 |
| Initial backoff | 1000ms |
| Formula | `1000ms * 2^(attempt-1) + jitter(0-500ms)` |

**Retryable Errors:**
- Rate limit (429)
- Server errors (5xx)
- Network errors (ECONNRESET, ETIMEDOUT, socket)

**Non-Retryable:**
- 4xx errors (except 429)
- Input validation errors
- Authentication failures

Failed calls wrapped in `AIClientError`.

## Client Features

### WhisperClient

```typescript
// Configurable language (auto-detect by default)
new WhisperClient({ apiKey, language: "ko" });
client.setLanguage(undefined);  // Switch to auto-detect
```

### EmbeddingClient

- Auto-truncates to ~11,250 chars (7500 tokens × 1.5 chars/token)
- Korean text optimization (1.5 chars/token vs English 4 chars/token)
- Long texts truncated with "..." indicator (no error thrown)
- Batch limit: 100 texts per request
- Throws `EmptyInputError` for empty input

## Usage

```typescript
// UseCases receive interfaces, not implementations
constructor(
  private llm: ILLMClient,
  private embedding: IEmbeddingClient
) {}
```

DI via `factories.ts` in `core/`.
