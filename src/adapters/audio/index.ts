export { WhisperAdapter, type TranscriptionProvider } from './whisper.adapter.js';

export {
  SoxRecordingAdapter,
  type RecordingProvider,
  type RecordingState,
  type RecordingEvents,
} from './recording.adapter.js';

// Re-export errors from types for backward compatibility
export { TranscriptionError, RecordingError } from '../../types/errors.js';
