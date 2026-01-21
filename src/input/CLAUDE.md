# Input Layer

Input handlers for different content types (text, image, audio, file, meeting).

## Structure

| File | Purpose |
|------|---------|
| `interfaces.ts` | Generic `InputHandler<T>` interface |
| `text.handler.ts` | Plain text input |
| `image.handler.ts` | Image analysis (Claude Vision) |
| `audio.handler.ts` | Audio transcription (Whisper) |
| `recording.handler.ts` | Live microphone recording (Whisper) |
| `file.handler.ts` | File content (txt, md, csv, json) |
| `meeting.handler.ts` | Meeting transcript processing |

## Interface

```typescript
interface InputHandler<TOutput> {
  handle(input: string): TOutput | Promise<TOutput>;
}
```

All handlers implement this interface for consistency.

## Recording Handler

`RecordingHandler` supports live microphone recording with auto-chunking:

- **Auto-chunk**: 10-minute chunks (stays under Whisper 25MB limit)
- **Unlimited duration**: No time limit for recording
- **Sequential transcription**: Chunks processed one by one, combined into single text

```typescript
const controller = handler.startRecording();
// ... recording ...
controller.stop();
const result = await handler.transcribe(controller.getChunkPaths());
await handler.cleanup(chunkPaths);
```

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
