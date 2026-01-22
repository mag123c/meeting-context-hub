import { createWriteStream, unlink, statSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import mic from "mic";
import type { WriteStream } from "fs";
import type { Readable } from "stream";
import type { WhisperClient } from "../ai/clients/whisper.client.js";
import type { CreateContextInput } from "../types/context.types.js";
import type {
  ChunkTranscriptionResult,
  TranscriptionResult,
} from "../types/transcription.types.js";
import {
  RecordingDependencyError,
  RecordingStreamError,
  PreflightError,
} from "../errors/index.js";
import {
  validateRecording,
  getRecordingInfo,
} from "../utils/preflight/index.js";
import { mergeWavFiles } from "../utils/audio-merge.js";

// 10 minutes per chunk (safe margin under 25MB Whisper limit)
const CHUNK_DURATION_MS = 10 * 60 * 1000;
// Check interval for chunk rotation
const CHECK_INTERVAL_MS = 1000;
// Retry configuration for transcription
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

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

  /**
   * Transcribe a single chunk with exponential backoff retry
   */
  private async transcribeChunkWithRetry(
    chunkPath: string,
    chunkIndex: number
  ): Promise<ChunkTranscriptionResult> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Check if file exists and has content
        const stats = statSync(chunkPath);
        if (stats.size <= 44) {
          // WAV header is 44 bytes, file is empty
          return {
            chunkIndex,
            chunkPath,
            success: true,
            text: "",
            attempts: attempt,
          };
        }

        const text = await this.whisper.transcribe(chunkPath);
        return {
          chunkIndex,
          chunkPath,
          success: true,
          text: text.trim(),
          attempts: attempt,
        };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);

        // If not the last attempt, wait with exponential backoff
        if (attempt < MAX_RETRIES) {
          const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    // All retries failed
    return {
      chunkIndex,
      chunkPath,
      success: false,
      error: lastError,
      attempts: MAX_RETRIES,
    };
  }

  /**
   * Transcribe all chunks with retry logic and partial success support
   */
  async transcribeWithRetry(chunkPaths: string[]): Promise<TranscriptionResult> {
    const results: ChunkTranscriptionResult[] = [];

    for (let i = 0; i < chunkPaths.length; i++) {
      const result = await this.transcribeChunkWithRetry(chunkPaths[i], i);
      results.push(result);
    }

    return {
      combinedText: results
        .filter((r) => r.success && r.text)
        .map((r) => r.text)
        .join("\n\n"),
      chunks: results,
      successCount: results.filter((r) => r.success).length,
      failedCount: results.filter((r) => !r.success).length,
      totalChunks: chunkPaths.length,
    };
  }

  /**
   * Legacy transcribe method for backward compatibility
   * @deprecated Use transcribeWithRetry for better error handling
   */
  async transcribe(chunkPaths: string[]): Promise<CreateContextInput> {
    const result = await this.transcribeWithRetry(chunkPaths);

    return {
      type: "audio",
      content: result.combinedText,
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

  /**
   * Save recording chunks to the vault recordings directory.
   * Merges all chunks into a single WAV file.
   *
   * @param chunkPaths - Array of chunk file paths
   * @param vaultPath - Path to the Obsidian vault
   * @returns Path to the saved recording file
   */
  async saveRecordings(chunkPaths: string[], vaultPath: string): Promise<string> {
    const recordingsDir = join(vaultPath, "recordings");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputPath = join(recordingsDir, `recording-${timestamp}.wav`);

    await mergeWavFiles(chunkPaths, outputPath);

    // Cleanup temp files after saving
    await this.cleanup(chunkPaths);

    return outputPath;
  }

  isRecording(): boolean {
    return this.micInstance !== null;
  }
}
