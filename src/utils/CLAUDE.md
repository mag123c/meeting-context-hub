# Utils

Common utility functions.

| File | Purpose |
|------|---------|
| `json-parser.ts` | JSON parsing (handles markdown code blocks) |
| `file-validator.ts` | File existence/extension validation |
| `filter.ts` | Context filtering (tags, type, project, sprint) |
| `related-links.ts` | Related document linking |
| `math.ts` | Math utilities (cosineSimilarity) |
| `text-normalizer.ts` | Korean text normalization for filenames |
| `meeting-formatter.ts` | Meeting markdown formatter for Obsidian |
| `path-sanitizer.ts` | Path sanitization and traversal prevention |
| `atomic-file.ts` | Atomic file writes and file locking |
| `audio-merge.ts` | WAV file merging for multi-chunk recordings |

## Pre-flight Validation (`preflight/`)

Validates conditions before operations to provide clear error messages.

| File | Purpose |
|------|---------|
| `types.ts` | Type definitions, error codes, size limits |
| `preflight-runner.ts` | Orchestrates validators, formats results |
| `validators/file.validator.ts` | File validation (size, permissions, encoding) |
| `validators/recording.validator.ts` | Recording prerequisites (binary, disk, mic) |

### Size Limits

| Category | Limit | Reason |
|----------|-------|--------|
| Image | 15MB | Claude Vision API |
| Audio | 25MB | Whisper API |
| Document | 10MB | Text file limit |
| Meeting | 5MB | Transcript limit |

### Validators

| Function | Checks |
|----------|--------|
| `validateImageFile()` | Size, magic bytes, readable, not symlink |
| `validateAudioFile()` | Size, magic bytes, readable, not symlink |
| `validateDocumentFile()` | Size, UTF-8 encoding, readable, not symlink |
| `validateMeetingFile()` | Size, UTF-8 encoding, readable, not symlink |
| `validateRecording()` | Binary (sox/arecord), mic permission, disk space |

## Path Sanitization (`path-sanitizer.ts`)

Prevents directory traversal attacks.

| Function | Purpose |
|----------|---------|
| `sanitizePathSegment()` | Remove invalid chars, reserved names |
| `validatePathWithinBase()` | Ensure path stays in base directory |
| `buildSafePath()` | Build safe path with validation |
| `safeBasename()` | Extract safe filename |
| `normalizeForCollision()` | Normalize for collision detection |

## Atomic File Operations (`atomic-file.ts`)

Safe file writes with rollback capability.

| Function/Class | Purpose |
|----------------|---------|
| `atomicWriteFile()` | Write via temp file + rename |
| `FileLock` | In-process file lock |
| `withFileLock()` | Execute with auto lock/unlock |
| `safeReadFile()` | Read with null on ENOENT |
| `generateUniqueFilename()` | Avoid filename collisions |
