/**
 * Pre-flight Runner
 * Orchestrates all validators and returns combined results
 */

import type { PreflightResult, ValidationIssue } from "./types.js";
import {
  validateImageFile,
  validateAudioFile,
  validateDocumentFile,
  validateMeetingFile,
} from "./validators/file.validator.js";
import { validateRecording } from "./validators/recording.validator.js";

export type PreflightCheckType = "image" | "audio" | "document" | "meeting" | "recording";

export interface PreflightOptions {
  type: PreflightCheckType;
  filePath?: string;
}

/**
 * Run pre-flight checks based on type
 */
export function runPreflight(options: PreflightOptions): PreflightResult {
  const { type, filePath } = options;

  switch (type) {
    case "image":
      if (!filePath) {
        return {
          valid: false,
          issues: [{
            code: "MISSING_FILE_PATH",
            severity: "error",
            message: "File path is required for image validation",
            solution: "Provide a file path to validate",
          }],
        };
      }
      return validateImageFile(filePath);

    case "audio":
      if (!filePath) {
        return {
          valid: false,
          issues: [{
            code: "MISSING_FILE_PATH",
            severity: "error",
            message: "File path is required for audio validation",
            solution: "Provide a file path to validate",
          }],
        };
      }
      return validateAudioFile(filePath);

    case "document":
      if (!filePath) {
        return {
          valid: false,
          issues: [{
            code: "MISSING_FILE_PATH",
            severity: "error",
            message: "File path is required for document validation",
            solution: "Provide a file path to validate",
          }],
        };
      }
      return validateDocumentFile(filePath);

    case "meeting":
      if (!filePath) {
        return {
          valid: false,
          issues: [{
            code: "MISSING_FILE_PATH",
            severity: "error",
            message: "File path is required for meeting validation",
            solution: "Provide a file path to validate",
          }],
        };
      }
      return validateMeetingFile(filePath);

    case "recording":
      return validateRecording();

    default:
      return {
        valid: false,
        issues: [{
          code: "UNKNOWN_CHECK_TYPE",
          severity: "error",
          message: `Unknown pre-flight check type: ${type}`,
          solution: "Use one of: image, audio, document, meeting, recording",
        }],
      };
  }
}

/**
 * Run multiple pre-flight checks in parallel
 */
export function runPreflightBatch(
  checks: PreflightOptions[]
): Map<string, PreflightResult> {
  const results = new Map<string, PreflightResult>();

  for (const check of checks) {
    const key = check.filePath ?? check.type;
    results.set(key, runPreflight(check));
  }

  return results;
}

/**
 * Combine multiple pre-flight results into one
 */
export function combinePreflightResults(results: PreflightResult[]): PreflightResult {
  const allIssues: ValidationIssue[] = [];
  let valid = true;

  for (const result of results) {
    allIssues.push(...result.issues);
    if (!result.valid) {
      valid = false;
    }
  }

  return { valid, issues: allIssues };
}

/**
 * Format pre-flight result for display
 */
export function formatPreflightResult(result: PreflightResult): string {
  if (result.valid && result.issues.length === 0) {
    return "All pre-flight checks passed";
  }

  const lines: string[] = [];

  if (!result.valid) {
    lines.push("Pre-flight checks failed:");
  } else {
    lines.push("Pre-flight checks passed with warnings:");
  }

  for (const issue of result.issues) {
    const prefix = issue.severity === "error" ? "[ERROR]" : "[WARN]";
    lines.push(`  ${prefix} ${issue.message}`);
    lines.push(`         Solution: ${issue.solution}`);
  }

  return lines.join("\n");
}

/**
 * Get errors only from pre-flight result
 */
export function getPreflightErrors(result: PreflightResult): ValidationIssue[] {
  return result.issues.filter((issue) => issue.severity === "error");
}

/**
 * Get warnings only from pre-flight result
 */
export function getPreflightWarnings(result: PreflightResult): ValidationIssue[] {
  return result.issues.filter((issue) => issue.severity === "warning");
}
