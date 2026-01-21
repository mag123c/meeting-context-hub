import { createWriteStream, unlink, statSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import mic from "mic";
import type { WriteStream } from "fs";
import type { Readable } from "stream";
import type { WhisperClient } from "../ai/clients/whisper.client.js";
import type { CreateContextInput } from "../types/context.types.js";
import {
  RecordingDependencyError,
  RecordingStreamError,
  PreflightError,
} from "../errors/index.js";
import {
  validateRecording,
  getRecordingInfo,
} from "../utils/preflight/index.js";

// 10 minutes per chunk (safe margin under 25MB Whisper limit)
const CHUNK_DURATION_MS = 10 * 60 * 1000;
// Check interval for chunk rotation
const CHECK_INTERVAL_MS = 1000;

export interface RecordingController {
  stop: () => void;
  getChunkPaths: () => string[];
  getChunkCount: () => number;
  getError: () => Error | null;
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
  private streamError: Error | null = null;

  constructor(private whisper: WhisperClient) {}

  /**
   * Check if recording dependencies are available
   * Caches the result for subsequent calls
   */
  static checkDependency(): {
    available: boolean;
    binary: string;
    os: string;
  } {
    const info = getRecordingInfo();
    if (this.checkedAvailable === null) {
      this.checkedAvailable = info.available;
    }
    return { available: this.checkedAvailable, binary: info.binary, os: info.os };
  }

  /**
   * Reset the cached dependency check (for testing)
   */
  static resetDependencyCheck(): void {
    this.checkedAvailable = null;
  }

  startRecording(): RecordingController {
    // Run full preflight validation
    const preflightResult = validateRecording();
    if (!preflightResult.valid) {
      // Check for specific error types
      const binaryMissing = preflightResult.issues.find(
        i => i.code === "RECORDING_BINARY_MISSING"
      );
      if (binaryMissing) {
        const dep = RecordingHandler.checkDependency();
        throw new RecordingDependencyError(
          dep.binary as "sox" | "arecord",
          dep.os as "macos" | "windows" | "linux"
        );
      }
      // Throw aggregate preflight error for other issues
      throw new PreflightError(preflightResult, "recording");
    }

    // Reset state
    this.sessionId = Date.now().toString();
    this.chunkPaths = [];
    this.streamError = null;

    this.micInstance = mic({
      rate: "16000",
      channels: "1",
      bitwidth: "16",
      encoding: "signed-integer",
      fileType: "wav",
      debug: false,
    });

    this.audioStream = this.micInstance.getAudioStream();

    // Track stream errors and auto-stop on error
    this.audioStream.on("error", (err) => {
      this.streamError = new RecordingStreamError(err.message, err);
      this.stopRecording(); // Auto-stop on error
    });

    // Start first chunk with error handling
    try {
      this.startNewChunk();
    } catch (err) {
      this.cleanup(this.chunkPaths);
      throw err;
    }

    this.micInstance.start();

    // Start chunk rotation check
    this.chunkCheckInterval = setInterval(() => {
      this.checkChunkRotation();
    }, CHECK_INTERVAL_MS);

    return {
      stop: () => this.stopRecording(),
      getChunkPaths: () => [...this.chunkPaths],
      getChunkCount: () => this.chunkPaths.length,
      getError: () => this.streamError,
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

    try {
      this.outputStream = createWriteStream(tempPath);

      // Handle output stream errors
      this.outputStream.on("error", (err) => {
        this.streamError = new RecordingStreamError(`Failed to write chunk: ${err.message}`, err);
        this.stopRecording();
      });

      this.chunkPaths.push(tempPath);
      this.audioStream?.pipe(this.outputStream);
      this.chunkStartTime = Date.now();
    } catch (err) {
      // If we can't create the output stream, throw and let caller handle cleanup
      throw new RecordingStreamError(
        `Failed to create recording chunk: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err : undefined
      );
    }
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
