import { resolve } from "path";
import { statSync } from "fs";
import type { CreateContextInput } from "../types/context.types.js";
import { WhisperClient } from "../ai/clients/whisper.client.js";
import { validateFile } from "../utils/index.js";
import { validateFilePreflight } from "../utils/preflight/index.js";
import { PreflightError } from "../errors/index.js";
import {
  splitWavFile,
  splitAudioWithFfmpeg,
  cleanupChunks,
  isFfmpegAvailable,
} from "../utils/audio-split.js";

// Whisper API limit
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export type AudioProgressPhase = "validating" | "splitting" | "transcribing";

export interface AudioProgress {
  phase: AudioProgressPhase;
  current: number;
  total: number;
  percent: number;
}

export type AudioProgressCallback = (progress: AudioProgress) => void;

export class AudioHandler {
  constructor(private whisper: WhisperClient) {}

  async handle(
    audioPath: string,
    onProgress?: AudioProgressCallback
  ): Promise<CreateContextInput> {
    const absolutePath = resolve(audioPath);
    const extension = audioPath.toLowerCase().split(".").pop() || "";

    // Report validation phase
    onProgress?.({ phase: "validating", current: 0, total: 1, percent: 0 });

    // Run basic preflight validation (existence, permissions, format)
    // Skip size check here - we'll handle large files with splitting
    const preflightResult = validateFilePreflight(audioPath, {
      category: "audio",
      checkMagicBytes: true,
      allowSymlink: false,
    });

    // Filter out size errors - we handle those with splitting
    const nonSizeIssues = preflightResult.issues.filter(
      (issue) => issue.code !== "FILE_TOO_LARGE"
    );

    if (nonSizeIssues.length > 0) {
      throw new PreflightError(
        { valid: false, issues: nonSizeIssues },
        "audio transcription"
      );
    }

    // Legacy validation for extension check
    const validation = validateFile(audioPath, "audio");
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    onProgress?.({ phase: "validating", current: 1, total: 1, percent: 100 });

    // Check if file needs splitting
    const stats = statSync(absolutePath);
    if (stats.size <= MAX_FILE_SIZE) {
      // Small file - direct transcription
      onProgress?.({ phase: "transcribing", current: 0, total: 1, percent: 0 });
      const transcription = await this.whisper.transcribe(absolutePath);
      onProgress?.({ phase: "transcribing", current: 1, total: 1, percent: 100 });
      return {
        type: "audio",
        content: transcription,
        source: absolutePath,
      };
    }

    // Large file - split and transcribe
    return this.handleLargeFile(absolutePath, extension, onProgress);
  }

  private async handleLargeFile(
    absolutePath: string,
    extension: string,
    onProgress?: AudioProgressCallback
  ): Promise<CreateContextInput> {
    let chunkPaths: string[] = [];
    const isWav = extension === "wav";

    try {
      // Split the file
      onProgress?.({ phase: "splitting", current: 0, total: 1, percent: 0 });

      if (isWav) {
        chunkPaths = await splitWavFile(absolutePath);
      } else {
        // Non-WAV formats require ffmpeg
        if (!isFfmpegAvailable()) {
          const sizeMB = (statSync(absolutePath).size / (1024 * 1024)).toFixed(1);
          throw new Error(
            `Audio file is too large (${sizeMB}MB, limit: 25MB). ` +
              `For non-WAV formats, install ffmpeg to enable auto-splitting: brew install ffmpeg`
          );
        }
        chunkPaths = await splitAudioWithFfmpeg(absolutePath);
      }

      onProgress?.({ phase: "splitting", current: 1, total: 1, percent: 100 });

      // Transcribe all chunks sequentially
      const transcriptions: string[] = [];
      const total = chunkPaths.length;

      for (let i = 0; i < chunkPaths.length; i++) {
        onProgress?.({
          phase: "transcribing",
          current: i,
          total,
          percent: Math.round((i / total) * 100),
        });

        const text = await this.whisper.transcribe(chunkPaths[i]);
        if (text.trim()) {
          transcriptions.push(text.trim());
        }
      }

      onProgress?.({ phase: "transcribing", current: total, total, percent: 100 });

      return {
        type: "audio",
        content: transcriptions.join("\n\n"),
        source: absolutePath,
      };
    } finally {
      // Cleanup temp chunks (but not if it's the original file)
      if (chunkPaths.length > 1 || chunkPaths[0] !== absolutePath) {
        cleanupChunks(chunkPaths);
      }
    }
  }
}
