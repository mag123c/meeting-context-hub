/**
 * Transcription Types
 * Types for audio chunk transcription with retry and partial success support
 */

export interface ChunkTranscriptionResult {
  chunkIndex: number;
  chunkPath: string;
  success: boolean;
  text?: string;
  error?: string;
  attempts: number;
}

export interface TranscriptionResult {
  combinedText: string;
  chunks: ChunkTranscriptionResult[];
  successCount: number;
  failedCount: number;
  totalChunks: number;
}
