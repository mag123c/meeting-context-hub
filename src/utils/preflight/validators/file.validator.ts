/**
 * File Pre-flight Validator
 * Validates file conditions before processing
 */

import { existsSync, lstatSync, statSync, readSync, openSync, closeSync, accessSync, constants } from "fs";
import { resolve, normalize, isAbsolute } from "path";
import {
  PREFLIGHT_ERROR_CODES,
  FILE_SIZE_LIMITS,
  MAGIC_BYTES,
  type PreflightResult,
  type ValidationIssue,
  type FileSizeCategory,
} from "../types.js";

export interface FileValidationOptions {
  category: FileSizeCategory;
  checkMagicBytes?: boolean;
  checkEncoding?: boolean;
  allowSymlink?: boolean;
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Check if path contains traversal patterns
 */
function hasPathTraversal(filePath: string): boolean {
  const normalized = normalize(filePath);
  // Check for .. patterns that remain after normalization
  if (normalized.includes("..")) return true;

  // Check if normalized path tries to escape from cwd
  const resolved = resolve(filePath);
  const cwd = process.cwd();

  // If the path starts with cwd or is absolute and doesn't contain .., it's safe
  if (isAbsolute(filePath)) {
    return false; // Absolute paths are allowed
  }

  // For relative paths, check if they try to escape
  return !resolved.startsWith(cwd);
}

/**
 * Check if file is a symlink
 */
function isSymlink(filePath: string): boolean {
  try {
    const stats = lstatSync(filePath);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Check if file has valid magic bytes for its extension
 */
function checkMagicBytes(filePath: string, extension: string): boolean {
  const patterns = MAGIC_BYTES[extension.toLowerCase()];
  if (!patterns) return true; // No pattern defined, skip check

  try {
    const fd = openSync(filePath, "r");
    const buffer = Buffer.alloc(12);
    const bytesRead = readSync(fd, buffer, 0, 12, 0);
    closeSync(fd);

    if (bytesRead < 2) return false;

    return patterns.some((pattern) => {
      for (let i = 0; i < pattern.length; i++) {
        if (buffer[i] !== pattern[i]) return false;
      }
      return true;
    });
  } catch {
    return false;
  }
}

/**
 * Check if file content is valid UTF-8
 */
function isValidUtf8(filePath: string): boolean {
  try {
    const fd = openSync(filePath, "r");
    // Read first 8KB for encoding check
    const buffer = Buffer.alloc(8192);
    const bytesRead = readSync(fd, buffer, 0, 8192, 0);
    closeSync(fd);

    if (bytesRead === 0) return true; // Empty file is valid UTF-8

    // Check for UTF-8 BOM or valid UTF-8 sequences
    const sample = buffer.slice(0, bytesRead);

    // Check for null bytes (likely binary)
    if (sample.includes(0)) {
      // Allow if it's at the end (padding)
      const firstNull = sample.indexOf(0);
      const nonNullAfter = sample.slice(firstNull).some(b => b !== 0);
      if (nonNullAfter) return false;
    }

    // Try to decode as UTF-8
    const decoder = new TextDecoder("utf-8", { fatal: true });
    try {
      decoder.decode(sample);
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

/**
 * Validate file for pre-flight checks
 */
export function validateFilePreflight(
  filePath: string,
  options: FileValidationOptions
): PreflightResult {
  const issues: ValidationIssue[] = [];
  const absolutePath = resolve(filePath);
  const sizeLimit = FILE_SIZE_LIMITS[options.category];
  const extension = filePath.toLowerCase().split(".").pop() || "";

  // 1. Path traversal check (for relative paths)
  if (!isAbsolute(filePath) && hasPathTraversal(filePath)) {
    issues.push({
      code: PREFLIGHT_ERROR_CODES.FILE_PATH_TRAVERSAL,
      severity: "error",
      message: `Path contains directory traversal pattern: ${filePath}`,
      solution: "Use an absolute path or a path within the current directory",
    });
    return { valid: false, issues };
  }

  // 2. File existence check
  if (!existsSync(absolutePath)) {
    issues.push({
      code: PREFLIGHT_ERROR_CODES.FILE_NOT_FOUND,
      severity: "error",
      message: `File not found: ${absolutePath}`,
      solution: "Check that the file path is correct and the file exists",
    });
    return { valid: false, issues };
  }

  // 3. Symlink check
  if (!options.allowSymlink && isSymlink(absolutePath)) {
    issues.push({
      code: PREFLIGHT_ERROR_CODES.FILE_IS_SYMLINK,
      severity: "error",
      message: `Symbolic links are not allowed: ${absolutePath}`,
      solution: "Provide the actual file path instead of a symlink",
    });
    return { valid: false, issues };
  }

  // 4. Read permission check
  // Note: accessSync can fail on macOS due to extended attributes (com.apple.macl, com.apple.provenance)
  // even when the file is readable. We try openSync as a fallback which is more reliable.
  try {
    accessSync(absolutePath, constants.R_OK);
  } catch {
    // Fallback: try to actually open the file for reading
    try {
      const fd = openSync(absolutePath, "r");
      closeSync(fd);
    } catch {
      issues.push({
        code: PREFLIGHT_ERROR_CODES.FILE_NO_READ_PERMISSION,
        severity: "error",
        message: `Cannot read file (permission denied): ${absolutePath}`,
        solution: "Check file permissions or run with appropriate privileges",
      });
      return { valid: false, issues };
    }
  }

  // 5. File size check
  try {
    const stats = statSync(absolutePath);

    if (stats.size === 0) {
      issues.push({
        code: PREFLIGHT_ERROR_CODES.FILE_EMPTY,
        severity: "error",
        message: `File is empty: ${absolutePath}`,
        solution: "Provide a file with content",
      });
      return { valid: false, issues };
    }

    if (stats.size > sizeLimit) {
      issues.push({
        code: PREFLIGHT_ERROR_CODES.FILE_TOO_LARGE,
        severity: "error",
        message: `File too large: ${formatBytes(stats.size)} (limit: ${formatBytes(sizeLimit)})`,
        solution: `Reduce file size to under ${formatBytes(sizeLimit)}`,
        details: {
          fileSize: stats.size,
          limit: sizeLimit,
          category: options.category,
        },
      });
      return { valid: false, issues };
    }
  } catch {
    issues.push({
      code: PREFLIGHT_ERROR_CODES.FILE_NO_READ_PERMISSION,
      severity: "error",
      message: `Cannot access file: ${absolutePath}`,
      solution: "Check file permissions",
    });
    return { valid: false, issues };
  }

  // 6. Magic bytes check (for images and audio)
  if (options.checkMagicBytes && (options.category === "image" || options.category === "audio")) {
    if (!checkMagicBytes(absolutePath, extension)) {
      issues.push({
        code: PREFLIGHT_ERROR_CODES.FILE_UNSUPPORTED_FORMAT,
        severity: "error",
        message: `File content does not match ${extension} format`,
        solution: `Ensure the file is a valid ${extension} file`,
      });
      return { valid: false, issues };
    }
  }

  // 7. UTF-8 encoding check (for documents)
  if (options.checkEncoding && options.category === "document") {
    if (!isValidUtf8(absolutePath)) {
      issues.push({
        code: PREFLIGHT_ERROR_CODES.FILE_INVALID_ENCODING,
        severity: "error",
        message: "File is not valid UTF-8 encoded text",
        solution: "Convert the file to UTF-8 encoding",
      });
      return { valid: false, issues };
    }
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Validate image file
 */
export function validateImageFile(filePath: string): PreflightResult {
  return validateFilePreflight(filePath, {
    category: "image",
    checkMagicBytes: true,
    allowSymlink: false,
  });
}

/**
 * Validate audio file
 */
export function validateAudioFile(filePath: string): PreflightResult {
  return validateFilePreflight(filePath, {
    category: "audio",
    checkMagicBytes: true,
    allowSymlink: false,
  });
}

/**
 * Validate document file
 */
export function validateDocumentFile(filePath: string): PreflightResult {
  return validateFilePreflight(filePath, {
    category: "document",
    checkEncoding: true,
    allowSymlink: false,
  });
}

/**
 * Validate meeting transcript file
 */
export function validateMeetingFile(filePath: string): PreflightResult {
  return validateFilePreflight(filePath, {
    category: "meeting",
    checkEncoding: true,
    allowSymlink: false,
  });
}
