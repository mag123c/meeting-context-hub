import { useEffect, useRef } from "react";
import { homedir } from "os";

export interface UseDropDetectionOptions {
  enabled?: boolean;
}

export interface UseDropDetectionResult {
  detectAndNormalize: (value: string) => string | null;
}

/**
 * Hook to detect and normalize file paths from drag and drop operations.
 *
 * When files are dragged into a terminal, the terminal typically inserts
 * the file path as text. This hook detects such paths and normalizes them.
 *
 * Detection patterns:
 * - Absolute paths starting with /
 * - Home-relative paths starting with ~
 * - Quoted paths (single or double quotes)
 * - Paths with escaped spaces (\ )
 */
export function useDropDetection(
  value: string,
  onChange: (value: string) => void,
  options: UseDropDetectionOptions = {}
): UseDropDetectionResult {
  const { enabled = true } = options;
  const previousValueRef = useRef(value);

  useEffect(() => {
    if (!enabled) return;

    const previousValue = previousValueRef.current;
    previousValueRef.current = value;

    // Only process if value changed significantly (likely a drop)
    // Drop typically adds many characters at once
    if (value.length - previousValue.length < 3) return;

    // Detect if this looks like a dropped file path
    const detected = detectDroppedPath(value);
    if (detected && detected !== value) {
      onChange(detected);
    }
  }, [value, onChange, enabled]);

  const detectAndNormalize = (inputValue: string): string | null => {
    return detectDroppedPath(inputValue);
  };

  return { detectAndNormalize };
}

/**
 * Detect and normalize a dropped file path
 */
function detectDroppedPath(value: string): string | null {
  const trimmed = value.trim();

  // Check for common path patterns
  const pathPatterns = [
    // Quoted paths (drag and drop often quotes paths with spaces)
    /^["'](.+)["']$/,
    // Absolute paths
    /^(\/[^\s]*(?:\\ [^\s]*)*)$/,
    // Home-relative paths
    /^(~\/[^\s]*(?:\\ [^\s]*)*)$/,
  ];

  for (const pattern of pathPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return normalizePath(match[1] || match[0]);
    }
  }

  // Check if it looks like a path (contains / and no obvious non-path characters)
  if (trimmed.includes("/") && !trimmed.includes("\n") && !trimmed.includes("\t")) {
    // Might be a path without special handling needed
    const normalized = normalizePath(trimmed);
    if (normalized.startsWith("/") || normalized.startsWith("~")) {
      return normalized;
    }
  }

  return null;
}

/**
 * Normalize a path string:
 * - Remove quotes
 * - Unescape spaces
 * - Expand ~ to home directory
 */
function normalizePath(path: string): string {
  let normalized = path;

  // Remove surrounding quotes
  if ((normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'"))) {
    normalized = normalized.slice(1, -1);
  }

  // Unescape spaces
  normalized = normalized.replace(/\\ /g, " ");

  // Expand ~ to home directory
  if (normalized.startsWith("~")) {
    normalized = normalized.replace(/^~/, homedir());
  }

  return normalized;
}
