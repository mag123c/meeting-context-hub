/**
 * Whisper Transcription Types
 *
 * Common types for all transcription providers (OpenAI API, local Whisper)
 */

/**
 * Transcription provider interface
 */
export interface TranscriptionProvider {
  /**
   * Transcribe audio file to text
   */
  transcribeFile(filePath: string): Promise<string>;

  /**
   * Transcribe audio buffer to text
   */
  transcribeBuffer(buffer: Buffer, filename?: string): Promise<string>;
}

/**
 * Transcription mode configuration
 */
export type TranscriptionMode = 'local' | 'api' | 'auto';

/**
 * Local Whisper model options
 */
export type WhisperModel = 'tiny' | 'base' | 'small' | 'medium' | 'large';

/**
 * Transcription configuration
 */
export interface TranscriptionConfig {
  /**
   * Transcription mode
   * - local: Use local Whisper only
   * - api: Use OpenAI API only
   * - auto: Try local first, fallback to API
   */
  mode: TranscriptionMode;

  /**
   * Local Whisper model to use
   */
  localModel: WhisperModel;

  /**
   * Enable VAD-based chunking
   */
  useVad: boolean;

  /**
   * Chunk overlap in milliseconds (prevents word cutoff)
   */
  chunkOverlapMs: number;

  /**
   * Custom vocabulary for improved recognition
   */
  vocabulary: string[];
}

/**
 * Default transcription configuration
 */
export const DEFAULT_TRANSCRIPTION_CONFIG: TranscriptionConfig = {
  mode: 'auto',
  localModel: 'base',
  useVad: true,
  chunkOverlapMs: 200,
  vocabulary: [],
};

/**
 * VAD segment representing a portion of audio with speech
 */
export interface VadSegment {
  /**
   * Start time in milliseconds
   */
  startMs: number;

  /**
   * End time in milliseconds
   */
  endMs: number;

  /**
   * Average RMS (volume) of the segment
   */
  avgRms: number;
}

/**
 * VAD configuration options
 */
export interface VadConfig {
  /**
   * RMS threshold for silence detection (0-1)
   */
  silenceThreshold: number;

  /**
   * Minimum silence duration in ms to consider as segment boundary
   */
  minSilenceDurationMs: number;

  /**
   * Chunk overlap in ms to prevent word cutoff
   */
  chunkOverlapMs: number;

  /**
   * Use adaptive noise floor estimation
   */
  useAdaptiveThreshold: boolean;
}

/**
 * Default VAD configuration
 */
export const DEFAULT_VAD_CONFIG: VadConfig = {
  silenceThreshold: 0.01,
  minSilenceDurationMs: 700,
  chunkOverlapMs: 200,
  useAdaptiveThreshold: true,
};
