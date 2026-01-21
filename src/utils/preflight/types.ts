/**
 * Pre-flight Validation Types
 * Validates conditions before operations to provide clear error messages
 */

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  code: string;
  severity: ValidationSeverity;
  message: string;
  solution: string;
  details?: Record<string, unknown>;
}

export interface PreflightResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export const PREFLIGHT_ERROR_CODES = {
  // File errors
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  FILE_NO_READ_PERMISSION: "FILE_NO_READ_PERMISSION",
  FILE_IS_SYMLINK: "FILE_IS_SYMLINK",
  FILE_INVALID_ENCODING: "FILE_INVALID_ENCODING",
  FILE_UNSUPPORTED_FORMAT: "FILE_UNSUPPORTED_FORMAT",
  FILE_PATH_TRAVERSAL: "FILE_PATH_TRAVERSAL",
  FILE_EMPTY: "FILE_EMPTY",

  // API errors
  API_KEY_MISSING: "API_KEY_MISSING",
  API_KEY_INVALID_FORMAT: "API_KEY_INVALID_FORMAT",

  // Resource errors
  DISK_SPACE_LOW: "DISK_SPACE_LOW",
  TEMP_DIR_NOT_WRITABLE: "TEMP_DIR_NOT_WRITABLE",

  // Recording errors
  RECORDING_BINARY_MISSING: "RECORDING_BINARY_MISSING",
  RECORDING_MIC_NO_PERMISSION: "RECORDING_MIC_NO_PERMISSION",
} as const;

export type PreflightErrorCode = (typeof PREFLIGHT_ERROR_CODES)[keyof typeof PREFLIGHT_ERROR_CODES];

/**
 * Size limits for different file types (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  image: 15 * 1024 * 1024,    // 15MB - Claude Vision limit
  audio: 25 * 1024 * 1024,    // 25MB - Whisper limit
  document: 10 * 1024 * 1024, // 10MB - reasonable limit for text files
  meeting: 5 * 1024 * 1024,   // 5MB - meeting transcripts
} as const;

export type FileSizeCategory = keyof typeof FILE_SIZE_LIMITS;

/**
 * Magic bytes for file type verification
 */
export const MAGIC_BYTES: Record<string, number[][]> = {
  // JPEG
  jpg: [[0xFF, 0xD8, 0xFF]],
  jpeg: [[0xFF, 0xD8, 0xFF]],
  // PNG
  png: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  // GIF
  gif: [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
  // WebP
  webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF header (need to check for WEBP at offset 8)
  // MP3
  mp3: [[0xFF, 0xFB], [0xFF, 0xFA], [0xFF, 0xF3], [0xFF, 0xF2], [0x49, 0x44, 0x33]], // ID3 header
  // WAV
  wav: [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  // MP4/M4A
  mp4: [[0x00, 0x00, 0x00]], // ftyp at offset 4
  m4a: [[0x00, 0x00, 0x00]],
  // WebM
  webm: [[0x1A, 0x45, 0xDF, 0xA3]],
};

/**
 * Minimum disk space required for recording (in bytes)
 */
export const MIN_DISK_SPACE = 100 * 1024 * 1024; // 100MB
