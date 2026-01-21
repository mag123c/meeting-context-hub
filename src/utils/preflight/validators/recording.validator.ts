/**
 * Recording Pre-flight Validator
 * Validates recording conditions before starting
 */

import { execSync, spawnSync } from "child_process";
import { tmpdir, platform } from "os";
import { accessSync, constants } from "fs";
import {
  PREFLIGHT_ERROR_CODES,
  MIN_DISK_SPACE,
  type PreflightResult,
  type ValidationIssue,
} from "../types.js";

type RecordingOS = "macos" | "windows" | "linux";
type RecordingBinary = "sox" | "arecord";

/**
 * Get recording binary and OS for current platform
 */
function getRecordingBinary(): { binary: RecordingBinary; os: RecordingOS } {
  const p = platform();
  if (p === "linux") return { binary: "arecord", os: "linux" };
  return { binary: "sox", os: p === "darwin" ? "macos" : "windows" };
}

/**
 * Check if a binary is available in PATH
 */
function isBinaryAvailable(binary: string): boolean {
  try {
    const cmd = platform() === "win32" ? "where" : "which";
    const result = spawnSync(cmd, [binary], { stdio: "pipe" });
    return result.status === 0;
  } catch {
    return false;
  }
}

/**
 * Get install instructions for recording binary
 */
function getInstallInstructions(_binary: RecordingBinary, os: RecordingOS): string {
  const instructions: Record<RecordingOS, string> = {
    macos: "brew install sox",
    windows: "choco install sox.portable",
    linux: "sudo apt install alsa-utils",
  };
  return instructions[os];
}

/**
 * Check available disk space in temp directory
 */
function checkDiskSpace(): { available: number; sufficient: boolean } {
  const tempPath = tmpdir();

  try {
    if (platform() === "win32") {
      // Windows: use wmic or fsutil
      const result = execSync(`wmic logicaldisk where "DeviceID='${tempPath.charAt(0)}:'" get FreeSpace`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      const lines = result.trim().split("\n");
      if (lines.length >= 2) {
        const freeSpace = parseInt(lines[1].trim(), 10);
        return { available: freeSpace, sufficient: freeSpace >= MIN_DISK_SPACE };
      }
    } else {
      // Unix: use df
      const result = execSync(`df -k "${tempPath}" | tail -1 | awk '{print $4}'`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      const availableKB = parseInt(result.trim(), 10);
      const available = availableKB * 1024;
      return { available, sufficient: available >= MIN_DISK_SPACE };
    }
  } catch {
    // If we can't check, assume it's fine but warn
    return { available: -1, sufficient: true };
  }

  return { available: -1, sufficient: true };
}

/**
 * Check if temp directory is writable
 */
function isTempWritable(): boolean {
  const tempPath = tmpdir();
  try {
    accessSync(tempPath, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 0) return "unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate recording conditions
 */
export function validateRecording(): PreflightResult {
  const issues: ValidationIssue[] = [];
  const { binary, os } = getRecordingBinary();

  // 1. Check if recording binary is available
  if (!isBinaryAvailable(binary)) {
    issues.push({
      code: PREFLIGHT_ERROR_CODES.RECORDING_BINARY_MISSING,
      severity: "error",
      message: `Recording requires ${binary} which is not installed`,
      solution: `Install with: ${getInstallInstructions(binary, os)}`,
      details: { binary, os },
    });
    // Return early - no point checking other things if binary is missing
    return { valid: false, issues };
  }

  // 2. Check temp directory is writable
  if (!isTempWritable()) {
    issues.push({
      code: PREFLIGHT_ERROR_CODES.TEMP_DIR_NOT_WRITABLE,
      severity: "error",
      message: `Temp directory is not writable: ${tmpdir()}`,
      solution: "Check permissions on temp directory or set TMPDIR environment variable",
      details: { tempDir: tmpdir() },
    });
  }

  // 3. Check disk space
  const diskSpace = checkDiskSpace();
  if (!diskSpace.sufficient) {
    issues.push({
      code: PREFLIGHT_ERROR_CODES.DISK_SPACE_LOW,
      severity: "error",
      message: `Insufficient disk space: ${formatBytes(diskSpace.available)} available (need ${formatBytes(MIN_DISK_SPACE)})`,
      solution: "Free up disk space before recording",
      details: {
        available: diskSpace.available,
        required: MIN_DISK_SPACE,
      },
    });
  }

  return {
    valid: issues.filter((i) => i.severity === "error").length === 0,
    issues,
  };
}

/**
 * Quick check if recording is possible (binary only)
 * Use this for faster checks when full validation is not needed
 */
export function isRecordingAvailable(): boolean {
  const { binary } = getRecordingBinary();
  return isBinaryAvailable(binary);
}

/**
 * Get recording binary info
 */
export function getRecordingInfo(): { binary: RecordingBinary; os: RecordingOS; available: boolean } {
  const { binary, os } = getRecordingBinary();
  return { binary, os, available: isBinaryAvailable(binary) };
}
