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
- **Error recovery**: Stream errors auto-stop recording, accessible via `getError()`

```typescript
const controller = handler.startRecording();
// ... recording ...
controller.stop();
if (controller.getError()) { /* handle error */ }
const result = await handler.transcribe(controller.getChunkPaths());
await handler.cleanup(chunkPaths);
```

## Pre-flight Validation

All file handlers run pre-flight checks BEFORE processing:

| Handler | Checks |
|---------|--------|
| `image.handler` | Size ≤15MB, magic bytes, readable, not symlink |
| `audio.handler` | Size ≤25MB, magic bytes, readable, not symlink |
| `file.handler` | Size ≤10MB, UTF-8, readable, not symlink |
| `meeting.handler` | Size ≤5MB (file) or ≤5MB chars (text), UTF-8 |
| `recording.handler` | Binary available, mic permission, disk space |

**Error Handling:**

```typescript
const preflightResult = validateDocumentFile(filePath);
if (!preflightResult.valid) {
  throw new PreflightError(preflightResult, "file processing");
}
```

`PreflightError` provides:
- `getFormattedMessage()` - User-friendly multi-line error
- `getErrors()` - Error-severity issues
- `getWarnings()` - Warning-severity issues

## Security

### File Validation
- Pre-flight validation rejects symlinks
- Path traversal prevention via absolute path resolution
- Size limits enforced before reading files
- UTF-8 encoding validated for text files

### Meeting Handler
- Improved file path detection (not just extension check)
- Validates both file path and direct text input
- Length limits prevent memory issues
