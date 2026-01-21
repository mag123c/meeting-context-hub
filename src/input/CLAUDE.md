# Input Layer

Input handlers for different content types (text, image, audio, file, meeting).

## Structure

| File | Purpose |
|------|---------|
| `interfaces.ts` | Generic `InputHandler<T>` interface |
| `text.handler.ts` | Plain text input |
| `image.handler.ts` | Image analysis (Claude Vision) |
| `audio.handler.ts` | Audio transcription (Whisper) |
| `file.handler.ts` | File content (txt, md, csv, json) |
| `meeting.handler.ts` | Meeting transcript processing |

## Interface

```typescript
interface InputHandler<TOutput> {
  handle(input: string): TOutput | Promise<TOutput>;
}
```

All handlers implement this interface for consistency.

## Security

### File Validation
- `meeting.handler.ts` uses `validateFile()` before `readFile()`
- Prevents path traversal attacks
- Validates file existence and extension

```typescript
// Safe: validation first
const validation = validateFile(input, "document");
if (!validation.valid) throw new Error(validation.error);
const content = await readFile(validation.absolutePath, "utf-8");
```
