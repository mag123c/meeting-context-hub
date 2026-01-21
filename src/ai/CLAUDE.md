# AI Layer

LLM, embedding, and transcription client abstraction with prompt management.

## Structure

| Directory | Purpose |
|-----------|---------|
| `interfaces/` | AI client interfaces |
| `clients/` | Implementations (Claude, OpenAI, Whisper) |
| `prompts/` | Prompt templates with versioning |

## Interfaces

| Interface | Implementation | Purpose |
|-----------|----------------|---------|
| `ILLMClient` | `ClaudeClient` | Text completion, image analysis |
| `IEmbeddingClient` | `EmbeddingClient` | Text embeddings (OpenAI) |
| `ITranscriptionClient` | `WhisperClient` | Audio transcription (OpenAI) |

## Usage

```typescript
// UseCases receive interfaces, not implementations
constructor(
  private llm: ILLMClient,
  private embedding: IEmbeddingClient
) {}
```

DI via `factories.ts` in `core/`.
