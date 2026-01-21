# Plan: Comprehensive Edge Case Fixes with Pre-flight Validation

## Summary

앱 전체 기능의 엣지케이스를 Pre-flight 검증 방식으로 수정. 작업 시작 전 모든 조건 검증, 실패 시 명확한 에러 메시지 제공.

**총 ~30개 항목**: CRITICAL(7) + HIGH(13) + MEDIUM(10)

---

## Phase 1: Pre-flight Validation System (Core)

### 1.1 Create Preflight Types
**File:** `src/utils/preflight/types.ts` (NEW)

```typescript
export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  code: string;
  severity: ValidationSeverity;
  message: string;
  solution: string;
  details?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export const PREFLIGHT_ERROR_CODES = {
  // File
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  FILE_NO_READ_PERMISSION: "FILE_NO_READ_PERMISSION",
  FILE_IS_SYMLINK: "FILE_IS_SYMLINK",
  FILE_INVALID_ENCODING: "FILE_INVALID_ENCODING",
  FILE_UNSUPPORTED_FORMAT: "FILE_UNSUPPORTED_FORMAT",
  FILE_PATH_TRAVERSAL: "FILE_PATH_TRAVERSAL",
  // API
  API_KEY_MISSING: "API_KEY_MISSING",
  API_KEY_INVALID_FORMAT: "API_KEY_INVALID_FORMAT",
  // Resource
  DISK_SPACE_LOW: "DISK_SPACE_LOW",
  // Recording
  RECORDING_BINARY_MISSING: "RECORDING_BINARY_MISSING",
  RECORDING_MIC_NO_PERMISSION: "RECORDING_MIC_NO_PERMISSION",
} as const;
```

### 1.2 Create File Validator
**File:** `src/utils/preflight/validators/file.validator.ts` (NEW)

- Size limits: image(15MB), audio(25MB), document(10MB)
- Symlink detection with `lstatSync()`
- Magic bytes verification for image/audio
- UTF-8 encoding check for documents
- Path traversal detection (`..` patterns)

### 1.3 Create Recording Validator
**File:** `src/utils/preflight/validators/recording.validator.ts` (NEW)

- Binary check (sox/arecord)
- Mic permission test (2초 테스트 녹음)
- Disk space check (최소 100MB)
- Temp directory writable check

### 1.4 Create Preflight Runner
**File:** `src/utils/preflight/preflight-runner.ts` (NEW)

- Orchestrates all validators
- Runs checks in parallel
- Returns combined result with errors/warnings

---

## Phase 2: Error Classes

### 2.1 Add New Error Classes
**File:** `src/errors/index.ts` (MODIFY)

```typescript
// File errors
export class FileSizeLimitError extends MCHError { }
export class FilePermissionError extends MCHError { }
export class SymlinkNotAllowedError extends MCHError { }
export class EncodingError extends MCHError { }
export class ImageFormatError extends MCHError { }
export class PathTraversalError extends MCHError { }

// Recording errors
export class MicrophonePermissionError extends MCHError { }
export class InsufficientDiskSpaceError extends MCHError { }
export class RecordingStreamError extends MCHError { }

// Preflight aggregate error
export class PreflightError extends MCHError {
  constructor(result: PreflightResult, operation: string) { }
  getFormattedMessage(): string { }
}
```

---

## Phase 3: Handler Fixes

### 3.1 Recording Handler
**File:** `src/input/recording.handler.ts` (MODIFY)

**Pre-flight checks:**
1. Binary available (sox/arecord)
2. Disk space ≥ 100MB
3. Mic permission test (2초 테스트)
4. Temp directory writable

**Stream error propagation:**
```typescript
private streamError: Error | null = null;

this.audioStream.on("error", (err) => {
  this.streamError = err;
  this.stopRecording();  // Auto-stop on error
});

// Add to RecordingController:
getError: () => this.streamError
```

**Cleanup guarantee:**
- Try-catch in startNewChunk with cleanup on failure

### 3.2 Audio Handler
**File:** `src/input/audio.handler.ts` (MODIFY)

**Pre-flight checks:**
1. File exists
2. Read permission
3. Size ≤ 25MB (Whisper limit)
4. Valid audio extension

### 3.3 Image Handler
**File:** `src/input/image.handler.ts` (MODIFY)

**Pre-flight checks:**
1. File exists
2. Read permission
3. Size ≤ 15MB (Claude Vision limit)
4. Magic bytes match extension

### 3.4 File Handler
**File:** `src/input/file.handler.ts` (MODIFY)

**Pre-flight checks:**
1. File exists
2. Not a symlink
3. Read permission
4. Size ≤ 10MB
5. Valid UTF-8 encoding

### 3.5 Meeting Handler
**File:** `src/input/meeting.handler.ts` (MODIFY)

**Pre-flight checks:**
1. Better file path detection (not just extension)
2. Size ≤ 5MB
3. Text length validation

---

## Phase 4: AI Client Fixes

### 4.1 Whisper Client
**File:** `src/ai/clients/whisper.client.ts` (MODIFY)

- Language configuration (not hardcoded "ko")
- Support auto-detect (no language param)

```typescript
export interface WhisperConfig {
  apiKey: string;
  language?: string;  // undefined = auto-detect
}
```

### 4.2 Claude Client
**File:** `src/ai/clients/claude.client.ts` (MODIFY)

- Retry logic (3 retries, exponential backoff)
- Retryable: 429, 5xx, network errors

### 4.3 Embedding Client
**File:** `src/ai/clients/embedding.client.ts` (MODIFY)

- Text length validation (≤ 30KB)
- Empty text rejection
- Retry logic

---

## Phase 5: Storage Security Fixes

### 5.1 Path Sanitizer
**File:** `src/utils/path-sanitizer.ts` (NEW)

```typescript
export function sanitizePathSegment(segment: string): string;
export function validatePathWithinBase(basePath: string, targetPath: string): boolean;
export function buildSafePath(basePath: string, ...segments: string[]): string;
```

### 5.2 Atomic File Operations
**File:** `src/utils/atomic-file.ts` (NEW)

```typescript
export async function atomicWriteFile(filePath: string, content: string): Promise<void>;
export class FileLock { acquire(); release(); }
export async function withFileLock<T>(filePath: string, operation: () => Promise<T>): Promise<T>;
```

### 5.3 Context Repository Fixes
**File:** `src/storage/obsidian/context.obsidian.ts` (MODIFY)

1. **Directory traversal fix**: Use `buildSafePath()` in `getHierarchyPath()`
2. **Filename collision fix**: Collision detection with incremental suffix
3. **Race condition fix**: Use `withFileLock()` in `appendRelatedLinks()`
4. **Corrupted file logging**: Log errors instead of silent skip

### 5.4 Config Validation
**File:** `src/config/config.ts` (MODIFY)

- API key format validation
- Obsidian vault path existence check
- `validateConfig()` function for health checks

---

## Phase 6: i18n Updates

**Files:** `src/i18n/types.ts`, `src/i18n/locales/en.ts`, `src/i18n/locales/ko.ts`

New keys:
```typescript
preflight: {
  checking: string;
  passed: string;
  failed: string;
  warnings: string;
};
errors: {
  fileTooLarge: string;
  filePermissionDenied: string;
  symlinkNotAllowed: string;
  invalidEncoding: string;
  pathTraversal: string;
  micPermissionDenied: string;
  diskSpaceLow: string;
  apiKeyInvalidFormat: string;
};
```

---

## File Changes Summary

| File | Action | Priority |
|------|--------|----------|
| `src/utils/preflight/types.ts` | CREATE | P1 |
| `src/utils/preflight/validators/file.validator.ts` | CREATE | P1 |
| `src/utils/preflight/validators/recording.validator.ts` | CREATE | P1 |
| `src/utils/preflight/preflight-runner.ts` | CREATE | P1 |
| `src/utils/preflight/index.ts` | CREATE | P1 |
| `src/utils/path-sanitizer.ts` | CREATE | P1 |
| `src/utils/atomic-file.ts` | CREATE | P2 |
| `src/errors/index.ts` | MODIFY | P1 |
| `src/input/recording.handler.ts` | MODIFY | P1 |
| `src/input/audio.handler.ts` | MODIFY | P2 |
| `src/input/image.handler.ts` | MODIFY | P2 |
| `src/input/file.handler.ts` | MODIFY | P2 |
| `src/input/meeting.handler.ts` | MODIFY | P2 |
| `src/ai/clients/whisper.client.ts` | MODIFY | P2 |
| `src/ai/clients/claude.client.ts` | MODIFY | P2 |
| `src/ai/clients/embedding.client.ts` | MODIFY | P2 |
| `src/storage/obsidian/context.obsidian.ts` | MODIFY | P1 |
| `src/config/config.ts` | MODIFY | P2 |
| `src/utils/file-validator.ts` | MODIFY | P1 |
| `src/i18n/types.ts` | MODIFY | P3 |
| `src/i18n/locales/en.ts` | MODIFY | P3 |
| `src/i18n/locales/ko.ts` | MODIFY | P3 |

---

## Implementation Order

1. **Phase 1**: Pre-flight system core (types, validators, runner)
2. **Phase 2**: Error classes
3. **Phase 3**: Handler fixes (recording first - highest risk)
4. **Phase 4**: AI client fixes
5. **Phase 5**: Storage security
6. **Phase 6**: i18n

---

## Verification

1. **Build**: `pnpm build`
2. **Lint**: `pnpm lint`
3. **Unit tests**: Add tests for validators

**Manual tests:**
- Recording without sox → Clear error message
- Recording without mic permission → Permission error
- Large file (>25MB audio) → Size error with limit info
- Symlink file → Symlink blocked error
- Invalid API key format → Format error
- Path traversal attempt → Blocked with error

---

## Identified Issues by Severity

### CRITICAL (7)
| Area | Issue |
|------|-------|
| Recording | Mic permission not checked → Silent recording failure |
| Recording | Disk space not checked → Data loss mid-recording |
| Recording | Stream errors not propagated → Silent failure |
| Image | Huge image loads into memory → Process crash |
| File | 100GB file into memory → Process crash |
| File | Symlink to system files → Security vulnerability |
| Storage | Directory traversal → Security vulnerability |

### HIGH (13)
| Area | Issue |
|------|-------|
| Audio | File size not validated (25MB limit) |
| Audio | File permissions not checked |
| Image | File size not validated (Vision limit) |
| Image | Format not verified (magic bytes) |
| File | Encoding not validated (UTF-8) |
| Meeting | File size not validated |
| Claude | No retry logic for transient errors |
| Whisper | Language hardcoded to Korean |
| Whisper | API key not validated |
| Embedding | Text length not validated |
| Config | API key format not validated |
| Config | Obsidian path not verified |
| Recording | Concurrent sessions collision |

### MEDIUM (10)
| Area | Issue |
|------|-------|
| Storage | Related links append race condition |
| Storage | Filename collision on short ID |
| Storage | Corrupted files silently skipped |
| AddContext | Related links failure ignored |
| Keychain | Error details not logged |
| TUI | Recording cleanup not guaranteed on error |
| TUI | Config screen key not validated before save |
| Search | Error state but still shows results |
| List | Filter not reset on load error |
| useRecording | Empty transcription accepted |
