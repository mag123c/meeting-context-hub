/**
 * Path Sanitization Utilities
 * Prevents directory traversal attacks and ensures safe file paths
 */

import { resolve, normalize, relative, basename, join } from "path";
import { PathTraversalError } from "../errors/index.js";

/**
 * Characters not allowed in path segments (cross-platform)
 * Includes control characters (0x00-0x1f) and special characters
 */
// eslint-disable-next-line no-control-regex
const INVALID_CHARS = /[<>:"|?*\x00-\x1f]/g;

/**
 * Reserved names on Windows
 */
const RESERVED_NAMES = [
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
];

/**
 * Sanitize a single path segment (filename or directory name)
 * Removes dangerous characters while preserving readability
 */
export function sanitizePathSegment(segment: string): string {
  if (!segment || typeof segment !== "string") {
    return "unnamed";
  }

  let sanitized = segment
    // Remove invalid characters
    .replace(INVALID_CHARS, "")
    // Replace path separators
    .replace(/[/\\]/g, "-")
    // Remove leading/trailing dots and spaces
    .replace(/^[\s.]+|[\s.]+$/g, "")
    // Collapse multiple dashes/underscores
    .replace(/[-_]{2,}/g, "-")
    // Trim to reasonable length
    .slice(0, 100);

  // Check for reserved names (Windows)
  const upperSegment = sanitized.toUpperCase();
  if (RESERVED_NAMES.includes(upperSegment) || RESERVED_NAMES.some(r => upperSegment.startsWith(r + "."))) {
    sanitized = `_${sanitized}`;
  }

  // Ensure non-empty
  if (!sanitized) {
    return "unnamed";
  }

  return sanitized;
}

/**
 * Validate that a target path stays within a base directory
 * Returns true if path is safe, false if it escapes
 */
export function validatePathWithinBase(basePath: string, targetPath: string): boolean {
  const normalizedBase = resolve(normalize(basePath));
  const normalizedTarget = resolve(normalize(targetPath));

  // Check that target starts with base
  // Use relative() and check it doesn't start with ".."
  const relativePath = relative(normalizedBase, normalizedTarget);

  if (relativePath.startsWith("..") || relativePath.startsWith("/") || relativePath.startsWith("\\")) {
    return false;
  }

  // Additional check: ensure the resolved path actually starts with base
  return normalizedTarget.startsWith(normalizedBase);
}

/**
 * Build a safe path by sanitizing each segment and validating result
 * Throws PathTraversalError if the result would escape basePath
 */
export function buildSafePath(basePath: string, ...segments: string[]): string {
  // Sanitize each segment
  const sanitizedSegments = segments
    .filter((s): s is string => s !== undefined && s !== null && s !== "")
    .map(sanitizePathSegment);

  // Build the path
  const targetPath = join(basePath, ...sanitizedSegments);

  // Validate it stays within base
  if (!validatePathWithinBase(basePath, targetPath)) {
    throw new PathTraversalError(targetPath);
  }

  return targetPath;
}

/**
 * Extract safe filename from a path (for display purposes)
 */
export function safeBasename(filePath: string): string {
  return sanitizePathSegment(basename(filePath));
}

/**
 * Check if a filename would cause collision issues
 * Returns normalized lowercase version for comparison
 */
export function normalizeForCollision(filename: string): string {
  return sanitizePathSegment(filename).toLowerCase();
}
