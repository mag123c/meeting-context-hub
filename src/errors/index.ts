/**
 * MCH base error class
 * Base for all custom errors
 */
export class MCHError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "MCHError";
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends MCHError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} not found: ${id}`
      : `${resource} not found`;
    super(message, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

/**
 * Input validation failed
 */
export class ValidationError extends MCHError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

/**
 * AI client error
 */
export class AIClientError extends MCHError {
  constructor(
    message: string,
    public readonly provider: "claude" | "openai"
  ) {
    super(message, "AI_CLIENT_ERROR");
    this.name = "AIClientError";
  }
}

/**
 * File system error
 */
export class FileSystemError extends MCHError {
  constructor(message: string, public readonly path: string) {
    super(message, "FILE_SYSTEM_ERROR");
    this.name = "FileSystemError";
  }
}

/**
 * Configuration error
 */
export class ConfigError extends MCHError {
  constructor(message: string) {
    super(message, "CONFIG_ERROR");
    this.name = "ConfigError";
  }
}

/**
 * API key missing error
 */
export class APIKeyMissingError extends MCHError {
  constructor(public readonly provider: "anthropic" | "openai") {
    const envKey = provider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY";
    super(
      `${provider.toUpperCase()} API key not configured. Run: mch config set ${envKey} <key>`,
      "API_KEY_MISSING"
    );
    this.name = "APIKeyMissingError";
  }
}

/**
 * Recording dependency missing error
 */
export type RecordingOS = "macos" | "windows" | "linux";
export type RecordingBinary = "sox" | "arecord";

export class RecordingDependencyError extends MCHError {
  constructor(
    public readonly binary: RecordingBinary,
    public readonly os: RecordingOS
  ) {
    const instructions: Record<RecordingOS, string> = {
      macos: "brew install sox",
      windows: "choco install sox.portable",
      linux: "sudo apt install alsa-utils",
    };
    super(
      `Recording requires ${binary}. Install: ${instructions[os]}`,
      "RECORDING_DEPENDENCY_MISSING"
    );
    this.name = "RecordingDependencyError";
  }
}

// ============================================================================
// File-related errors
// ============================================================================

/**
 * File size exceeds limit
 */
export class FileSizeLimitError extends MCHError {
  constructor(
    public readonly path: string,
    public readonly fileSize: number,
    public readonly limit: number,
    public readonly category: string
  ) {
    const formatBytes = (bytes: number): string => {
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    super(
      `File too large: ${formatBytes(fileSize)} (limit: ${formatBytes(limit)} for ${category})`,
      "FILE_SIZE_LIMIT"
    );
    this.name = "FileSizeLimitError";
  }
}

/**
 * File permission error
 */
export class FilePermissionError extends MCHError {
  constructor(
    public readonly path: string,
    public readonly operation: "read" | "write" | "execute"
  ) {
    super(
      `Cannot ${operation} file (permission denied): ${path}`,
      "FILE_PERMISSION"
    );
    this.name = "FilePermissionError";
  }
}

/**
 * Symlink not allowed error
 */
export class SymlinkNotAllowedError extends MCHError {
  constructor(public readonly path: string) {
    super(
      `Symbolic links are not allowed: ${path}`,
      "SYMLINK_NOT_ALLOWED"
    );
    this.name = "SymlinkNotAllowedError";
  }
}

/**
 * Encoding error (not valid UTF-8)
 */
export class EncodingError extends MCHError {
  constructor(public readonly path: string) {
    super(
      `File is not valid UTF-8 encoded: ${path}`,
      "ENCODING_ERROR"
    );
    this.name = "EncodingError";
  }
}

/**
 * Image format error (magic bytes mismatch)
 */
export class ImageFormatError extends MCHError {
  constructor(
    public readonly path: string,
    public readonly expectedFormat: string
  ) {
    super(
      `File content does not match ${expectedFormat} format: ${path}`,
      "IMAGE_FORMAT_ERROR"
    );
    this.name = "ImageFormatError";
  }
}

/**
 * Path traversal attempt detected
 */
export class PathTraversalError extends MCHError {
  constructor(public readonly path: string) {
    super(
      `Path traversal detected: ${path}`,
      "PATH_TRAVERSAL"
    );
    this.name = "PathTraversalError";
  }
}

// ============================================================================
// Recording-related errors
// ============================================================================

/**
 * Microphone permission denied
 */
export class MicrophonePermissionError extends MCHError {
  constructor() {
    super(
      "Microphone access denied. Grant microphone permission in system settings.",
      "MIC_PERMISSION"
    );
    this.name = "MicrophonePermissionError";
  }
}

/**
 * Insufficient disk space
 */
export class InsufficientDiskSpaceError extends MCHError {
  constructor(
    public readonly available: number,
    public readonly required: number
  ) {
    const formatBytes = (bytes: number): string => {
      if (bytes < 0) return "unknown";
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    super(
      `Insufficient disk space: ${formatBytes(available)} available (need ${formatBytes(required)})`,
      "DISK_SPACE"
    );
    this.name = "InsufficientDiskSpaceError";
  }
}

/**
 * Recording stream error
 */
export class RecordingStreamError extends MCHError {
  constructor(
    public readonly reason: string,
    public readonly originalError?: Error
  ) {
    super(
      `Recording stream error: ${reason}`,
      "RECORDING_STREAM"
    );
    this.name = "RecordingStreamError";
  }
}

// ============================================================================
// Pre-flight aggregate error
// ============================================================================

import type { PreflightResult, ValidationIssue } from "../utils/preflight/types.js";

/**
 * Pre-flight validation failed
 */
export class PreflightError extends MCHError {
  constructor(
    public readonly result: PreflightResult,
    public readonly operation: string
  ) {
    const errorCount = result.issues.filter(i => i.severity === "error").length;
    const warningCount = result.issues.filter(i => i.severity === "warning").length;

    let summary = `Pre-flight check failed for ${operation}`;
    if (errorCount > 0) summary += ` (${errorCount} error${errorCount > 1 ? "s" : ""})`;
    if (warningCount > 0) summary += ` (${warningCount} warning${warningCount > 1 ? "s" : ""})`;

    super(summary, "PREFLIGHT_FAILED");
    this.name = "PreflightError";
  }

  /**
   * Get formatted error message with all issues
   */
  getFormattedMessage(): string {
    const lines: string[] = [this.message, ""];

    for (const issue of this.result.issues) {
      const prefix = issue.severity === "error" ? "[ERROR]" : "[WARN]";
      lines.push(`${prefix} ${issue.message}`);
      lines.push(`        Solution: ${issue.solution}`);
    }

    return lines.join("\n");
  }

  /**
   * Get errors only
   */
  getErrors(): ValidationIssue[] {
    return this.result.issues.filter(i => i.severity === "error");
  }

  /**
   * Get warnings only
   */
  getWarnings(): ValidationIssue[] {
    return this.result.issues.filter(i => i.severity === "warning");
  }
}

// ============================================================================
// Text validation errors
// ============================================================================

/**
 * Text length validation error
 */
export class TextLengthError extends MCHError {
  constructor(
    public readonly actualLength: number,
    public readonly maxLength: number,
    public readonly operation: string
  ) {
    super(
      `Text too long for ${operation}: ${actualLength} chars (limit: ${maxLength})`,
      "TEXT_LENGTH"
    );
    this.name = "TextLengthError";
  }
}

/**
 * Empty input error
 */
export class EmptyInputError extends MCHError {
  constructor(public readonly inputType: string) {
    super(
      `Empty ${inputType} provided`,
      "EMPTY_INPUT"
    );
    this.name = "EmptyInputError";
  }
}

// ============================================================================
// API-related errors
// ============================================================================

/**
 * API key format invalid
 */
export class APIKeyFormatError extends MCHError {
  constructor(public readonly provider: "anthropic" | "openai") {
    const expectedFormat = provider === "anthropic"
      ? "sk-ant-..."
      : "sk-...";
    super(
      `Invalid ${provider.toUpperCase()} API key format. Expected format: ${expectedFormat}`,
      "API_KEY_FORMAT"
    );
    this.name = "APIKeyFormatError";
  }
}

/**
 * Retryable API error (for retry logic)
 */
export class RetryableAPIError extends MCHError {
  constructor(
    public readonly provider: "claude" | "openai",
    public readonly statusCode: number,
    public readonly attempt: number,
    public readonly maxAttempts: number
  ) {
    super(
      `${provider} API error (status ${statusCode}), attempt ${attempt}/${maxAttempts}`,
      "RETRYABLE_API_ERROR"
    );
    this.name = "RetryableAPIError";
  }
}
