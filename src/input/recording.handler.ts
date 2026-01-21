import { createWriteStream, unlink, statSync } from "fs";
import { execSync } from "child_process";
import { tmpdir, platform } from "os";
import { join } from "path";
import mic from "mic";
import type { WriteStream } from "fs";
import type { Readable } from "stream";
import type { WhisperClient } from "../ai/clients/whisper.client.js";
import type { CreateContextInput } from "../types/context.types.js";
import {
  RecordingDependencyError,
  type RecordingBinary,
  type RecordingOS,
} from "../errors/index.js";

// 10 minutes per chunk (safe margin under 25MB Whisper limit)
const CHUNK_DURATION_MS = 10 * 60 * 1000;
// Check interval for chunk rotation
const CHECK_INTERVAL_MS = 1000;

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
    const cmd = platform() === "win32" ? `where ${binary}` : `which ${binary}`;
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export interface RecordingController {
  stop: () => void;
  getChunkPaths: () => string[];
  getChunkCount: () => number;
}

export class RecordingHandler {
  private static checkedAvailable: boolean | null = null;

  private micInstance: ReturnType<typeof mic> | null = null;
  private outputStream: WriteStream | null = null;
  private audioStream: Readable | null = null;
  private chunkPaths: string[] = [];
  private chunkStartTime: number = 0;
  private chunkCheckInterval: NodeJS.Timeout | null = null;
  private sessionId: string = "";

  constructor(private whisper: WhisperClient) {}

  /**
   * Check if recording dependencies are available
   * Caches the result for subsequent calls
   */
  static checkDependency(): {
    available: boolean;
    binary: RecordingBinary;
    os: RecordingOS;
  } {
    const { binary, os } = getRecordingBinary();
    if (this.checkedAvailable === null) {
      this.checkedAvailable = isBinaryAvailable(binary);
    }
    return { available: this.checkedAvailable, binary, os };
  }

  /**
   * Reset the cached dependency check (for testing)
   */
  static resetDependencyCheck(): void {
    this.checkedAvailable = null;
  }

  startRecording(): RecordingController {
    // Check dependency before starting
    const dep = RecordingHandler.checkDependency();
    if (!dep.available) {
      throw new RecordingDependencyError(dep.binary, dep.os);
    }

    this.sessionId = Date.now().toString();
    this.chunkPaths = [];

    this.micInstance = mic({
      rate: "16000",
      channels: "1",
      bitwidth: "16",
      encoding: "signed-integer",
      fileType: "wav",
      debug: false,
    });

    this.audioStream = this.micInstance.getAudioStream();

    this.audioStream.on("error", (err) => {
      console.error("Recording error:", err);
    });

    // Start first chunk
    this.startNewChunk();

    this.micInstance.start();

    // Start chunk rotation check
    this.chunkCheckInterval = setInterval(() => {
      this.checkChunkRotation();
    }, CHECK_INTERVAL_MS);

    return {
      stop: () => this.stopRecording(),
      getChunkPaths: () => [...this.chunkPaths],
      getChunkCount: () => this.chunkPaths.length,
    };
  }

  private startNewChunk(): void {
    // Close previous chunk if exists
    if (this.outputStream) {
      this.audioStream?.unpipe(this.outputStream);
      this.outputStream.end();
    }

    const chunkIndex = this.chunkPaths.length;
    const tempPath = join(tmpdir(), `mch-rec-${this.sessionId}-${chunkIndex}.wav`);
    this.chunkPaths.push(tempPath);

    this.outputStream = createWriteStream(tempPath);
    this.audioStream?.pipe(this.outputStream);
    this.chunkStartTime = Date.now();
  }

  private checkChunkRotation(): void {
    if (!this.micInstance) return;

    const elapsed = Date.now() - this.chunkStartTime;
    if (elapsed >= CHUNK_DURATION_MS) {
      this.startNewChunk();
    }
  }

  private stopRecording(): void {
    // Clear interval
    if (this.chunkCheckInterval) {
      clearInterval(this.chunkCheckInterval);
      this.chunkCheckInterval = null;
    }

    // Stop mic
    if (this.micInstance) {
      this.micInstance.stop();
      this.micInstance = null;
    }

    // Close streams
    if (this.audioStream) {
      this.audioStream.unpipe();
      this.audioStream = null;
    }

    if (this.outputStream) {
      this.outputStream.end();
      this.outputStream = null;
    }
  }

  async transcribe(chunkPaths: string[]): Promise<CreateContextInput> {
    const transcriptions: string[] = [];

    // Process chunks sequentially
    for (const chunkPath of chunkPaths) {
      try {
        // Check if file exists and has content
        const stats = statSync(chunkPath);
        if (stats.size > 44) { // WAV header is 44 bytes
          const text = await this.whisper.transcribe(chunkPath);
          if (text.trim()) {
            transcriptions.push(text.trim());
          }
        }
      } catch (err) {
        console.error(`Failed to transcribe chunk ${chunkPath}:`, err);
        // Continue with other chunks
      }
    }

    const combinedContent = transcriptions.join("\n\n");

    return {
      type: "audio",
      content: combinedContent,
      source: `recording-${this.sessionId}`,
    };
  }

  async cleanup(chunkPaths: string[]): Promise<void> {
    const deletePromises = chunkPaths.map(
      (path) =>
        new Promise<void>((resolve) => {
          unlink(path, (err) => {
            if (err && err.code !== "ENOENT") {
              console.error(`Failed to cleanup temp file ${path}:`, err);
            }
            resolve();
          });
        })
    );

    await Promise.all(deletePromises);
  }

  isRecording(): boolean {
    return this.micInstance !== null;
  }
}
