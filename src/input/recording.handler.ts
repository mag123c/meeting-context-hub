import { createWriteStream, unlink, statSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import mic from "mic";
import type { WriteStream } from "fs";
import type { Readable } from "stream";
import type { WhisperClient } from "../ai/clients/whisper.client.js";
import type { CreateContextInput } from "../types/context.types.js";

// 10 minutes per chunk (safe margin under 25MB Whisper limit)
const CHUNK_DURATION_MS = 10 * 60 * 1000;
// Check interval for chunk rotation
const CHECK_INTERVAL_MS = 1000;

export interface RecordingController {
  stop: () => void;
  getChunkPaths: () => string[];
  getChunkCount: () => number;
}

export class RecordingHandler {
  private micInstance: ReturnType<typeof mic> | null = null;
  private outputStream: WriteStream | null = null;
  private audioStream: Readable | null = null;
  private chunkPaths: string[] = [];
  private chunkStartTime: number = 0;
  private chunkCheckInterval: NodeJS.Timeout | null = null;
  private sessionId: string = "";

  constructor(private whisper: WhisperClient) {}

  startRecording(): RecordingController {
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
