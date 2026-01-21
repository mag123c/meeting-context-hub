/**
 * Atomic File Operations
 * Ensures safe file writes with rollback capability
 */

import { writeFile, rename, unlink, readFile } from "fs/promises";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { randomBytes } from "crypto";

/**
 * Write file atomically using temp file + rename pattern
 * This prevents partial writes on crash/interrupt
 */
export async function atomicWriteFile(
  filePath: string,
  content: string,
  encoding: BufferEncoding = "utf-8"
): Promise<void> {
  const dir = dirname(filePath);
  const tempId = randomBytes(8).toString("hex");
  const tempPath = join(dir, `.tmp-${tempId}`);

  try {
    // Write to temp file first
    await writeFile(tempPath, content, encoding);

    // Atomically rename to target
    await rename(tempPath, filePath);
  } catch (error) {
    // Clean up temp file on failure
    try {
      if (existsSync(tempPath)) {
        await unlink(tempPath);
      }
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Simple in-memory file lock for single-process coordination
 * Note: This does NOT work across processes - use proper file locking for that
 */
const activeLocks = new Map<string, Promise<void>>();

export class FileLock {
  private lockPromise: Promise<void> | null = null;
  private releaseFn: (() => void) | null = null;

  constructor(private readonly filePath: string) {}

  /**
   * Acquire the lock - waits if another operation holds it
   */
  async acquire(): Promise<void> {
    // Wait for any existing lock on this file
    const existingLock = activeLocks.get(this.filePath);
    if (existingLock) {
      await existingLock;
    }

    // Create our lock
    let release: () => void;
    this.lockPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.releaseFn = release!;

    activeLocks.set(this.filePath, this.lockPromise);
  }

  /**
   * Release the lock
   */
  release(): void {
    if (this.releaseFn) {
      this.releaseFn();
      this.releaseFn = null;
    }

    if (activeLocks.get(this.filePath) === this.lockPromise) {
      activeLocks.delete(this.filePath);
    }

    this.lockPromise = null;
  }
}

/**
 * Execute an operation with file lock
 * Automatically acquires and releases lock
 */
export async function withFileLock<T>(
  filePath: string,
  operation: () => Promise<T>
): Promise<T> {
  const lock = new FileLock(filePath);

  try {
    await lock.acquire();
    return await operation();
  } finally {
    lock.release();
  }
}

/**
 * Read file with error wrapping
 */
export async function safeReadFile(
  filePath: string,
  encoding: BufferEncoding = "utf-8"
): Promise<string | null> {
  try {
    return await readFile(filePath, encoding);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

/**
 * Generate unique filename to avoid collisions
 * Appends incremental suffix if file exists
 */
export function generateUniqueFilename(
  _basePath: string,
  baseName: string,
  extension: string,
  existingFiles: Set<string>
): string {
  const fullName = `${baseName}${extension}`;
  const lowerFullName = fullName.toLowerCase();

  if (!existingFiles.has(lowerFullName)) {
    return fullName;
  }

  // Find unique suffix
  let counter = 1;
  while (counter < 1000) {
    const uniqueName = `${baseName}-${counter}${extension}`;
    if (!existingFiles.has(uniqueName.toLowerCase())) {
      return uniqueName;
    }
    counter++;
  }

  // Fallback with random suffix
  const randomSuffix = randomBytes(4).toString("hex");
  return `${baseName}-${randomSuffix}${extension}`;
}
