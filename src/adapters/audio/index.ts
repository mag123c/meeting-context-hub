// Types
export type {
  TranscriptionProvider,
  TranscriptionMode,
  WhisperModel,
  TranscriptionConfig,
  VadConfig,
  VadSegment,
} from './whisper.types.js';
export { DEFAULT_TRANSCRIPTION_CONFIG, DEFAULT_VAD_CONFIG } from './whisper.types.js';

// OpenAI Whisper Adapter
export {
  OpenAIWhisperAdapter,
  WhisperAdapter, // Legacy alias
  type OpenAIWhisperConfig,
} from './openai-whisper.adapter.js';

// Local Whisper Adapter
export {
  LocalWhisperAdapter,
  type LocalWhisperConfig,
} from './local-whisper.adapter.js';

// Factory
export {
  TranscriptionFactory,
  createTranscriptionProvider,
  type TranscriptionFactoryOptions,
} from './transcription.factory.js';

// Model Manager
export {
  ModelManager,
  getModelManager,
  type DownloadProgressCallback,
} from './model-manager.service.js';

// VAD Service
export {
  VadService,
  calculateRms,
  splitByVad,
  detectSilenceRegions,
} from './vad.service.js';

// Audio Splitter
export {
  splitWavBuffer,
  splitWavBufferWithVad,
  mergeTranscriptions,
  mergeTranscriptionsWithOverlap,
  parseWavMetadata,
  needsSplit,
  MAX_CHUNK_SIZE,
  type WavMetadata,
} from './audio-splitter.js';

// Recording
export {
  SoxRecordingAdapter,
  type RecordingProvider,
  type RecordingState,
  type RecordingEvents,
} from './recording.adapter.js';

// Re-export errors from types for backward compatibility
export { TranscriptionError, RecordingError } from '../../types/errors.js';
