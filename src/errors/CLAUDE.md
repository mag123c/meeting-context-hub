# Errors

Unified error handling system.

## Hierarchy

```
MCHError (base)
├── NotFoundError
├── ValidationError
├── AIClientError
├── FileSystemError
├── ConfigError
├── APIKeyMissingError
├── RecordingDependencyError
├── FileSizeLimitError
├── FilePermissionError
├── SymlinkNotAllowedError
├── EncodingError
├── ImageFormatError
├── PathTraversalError
├── MicrophonePermissionError
├── InsufficientDiskSpaceError
├── RecordingStreamError
├── PreflightError (aggregate)
├── TextLengthError
├── EmptyInputError
├── APIKeyFormatError
└── RetryableAPIError
```

## Error Classes

| Error | Code | Purpose |
|-------|------|---------|
| `NotFoundError` | `NOT_FOUND` | Resource not found |
| `ValidationError` | `VALIDATION_ERROR` | Input validation failed |
| `AIClientError` | `AI_CLIENT_ERROR` | AI API call failed |
| `FileSystemError` | `FILE_SYSTEM_ERROR` | File operation failed |
| `ConfigError` | `CONFIG_ERROR` | Config load/validation failed |
| `APIKeyMissingError` | `API_KEY_MISSING` | API key not configured |
| `RecordingDependencyError` | `RECORDING_DEPENDENCY_MISSING` | Recording binary missing (sox/arecord) |

### File Errors

| Error | Code | Purpose |
|-------|------|---------|
| `FileSizeLimitError` | `FILE_SIZE_LIMIT` | File exceeds category limit |
| `FilePermissionError` | `FILE_PERMISSION` | Read/write/execute permission denied |
| `SymlinkNotAllowedError` | `SYMLINK_NOT_ALLOWED` | Symbolic links rejected |
| `EncodingError` | `ENCODING_ERROR` | File not valid UTF-8 |
| `ImageFormatError` | `IMAGE_FORMAT_ERROR` | Magic bytes mismatch |
| `PathTraversalError` | `PATH_TRAVERSAL` | Directory traversal detected |

### Recording Errors

| Error | Code | Purpose |
|-------|------|---------|
| `MicrophonePermissionError` | `MIC_PERMISSION` | Microphone access denied |
| `InsufficientDiskSpaceError` | `DISK_SPACE` | Not enough space for recording |
| `RecordingStreamError` | `RECORDING_STREAM` | Recording stream failed |

### Validation Errors

| Error | Code | Purpose |
|-------|------|---------|
| `TextLengthError` | `TEXT_LENGTH` | Input text exceeds limit |
| `EmptyInputError` | `EMPTY_INPUT` | Empty input provided |
| `APIKeyFormatError` | `API_KEY_FORMAT` | API key format invalid |

### Special Errors

| Error | Code | Purpose |
|-------|------|---------|
| `PreflightError` | `PREFLIGHT_FAILED` | Pre-flight validation failed (aggregate) |
| `RetryableAPIError` | `RETRYABLE_API_ERROR` | Temporary API error with retry info |

## PreflightError

Wraps `PreflightResult` with multiple validation issues.

```typescript
const error = new PreflightError(result, "image processing");
error.getFormattedMessage();  // Multi-line formatted output
error.getErrors();            // Only error-severity issues
error.getWarnings();          // Only warning-severity issues
```
