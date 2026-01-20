# AI Layer

LLM, 임베딩, 음성 인식 클라이언트 추상화 및 프롬프트 관리.

## 구조

| 디렉토리 | 용도 |
|---------|------|
| `interfaces/` | AI 클라이언트 인터페이스 정의 |
| `clients/` | 클라이언트 구현체 (Claude, OpenAI, Whisper) |
| `prompts/` | 프롬프트 템플릿 및 설정 |

## AI 인터페이스

### ILLMClient

```typescript
interface ILLMClient {
  complete(prompt: Prompt, input: string): Promise<string>;
  analyzeImage(prompt: Prompt, imagePath: string): Promise<string>;
}
```

구현체: `ClaudeClient`

### IEmbeddingClient

```typescript
interface IEmbeddingClient {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
```

구현체: `EmbeddingClient` (OpenAI)

### ITranscriptionClient

```typescript
interface ITranscriptionClient {
  transcribe(audioPath: string): Promise<string>;
}
```

구현체: `WhisperClient` (OpenAI)

## 의존성 주입

UseCase에서는 구현체가 아닌 인터페이스 타입을 받음:

```typescript
export class AddContextUseCase {
  constructor(
    private repository: ContextRepository,
    private llm: ILLMClient,           // 인터페이스
    private embedding: IEmbeddingClient // 인터페이스
  ) {}
}
```

`factories.ts`에서 구체적인 구현체 주입.

## 프롬프트 관리

모든 프롬프트는 `version` 필드 포함:

```typescript
export const taggingPrompt: Prompt = {
  version: "1.0",
  system: "...",
  template: (input) => `...`,
};
```
