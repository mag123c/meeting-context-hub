import record from 'node-record-lpcm16';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { RecordingError, ErrorCode } from '../../types/errors.js';

/**
 * Recording state
 */
export type RecordingState = 'idle' | 'recording' | 'stopped';

/**
 * Recording events
 */
export interface RecordingEvents {
  onStart?: () => void;
  onStop?: (filePath: string) => void;
  onError?: (error: Error) => void;
  onData?: (chunk: Buffer) => void;
}

/**
 * Recording provider interface
 */
export interface RecordingProvider {
  start(events?: RecordingEvents): void;
  stop(): string | null;
  getState(): RecordingState;
  getDuration(): number;
}

/**
 * Audio recording adapter using sox
 */
export class SoxRecordingAdapter implements RecordingProvider {
  private state: RecordingState = 'idle';
  private recording: ReturnType<typeof record.record> | null = null;
  private filePath: string | null = null;
  private startTime: number | null = null;
  private events: RecordingEvents = {};

  constructor(private readonly outputDir?: string) {}

  /**
   * Start recording
   */
  start(events?: RecordingEvents): void {
    if (this.state === 'recording') {
      throw new RecordingError(
        'Already recording',
        ErrorCode.RECORDING_ALREADY_ACTIVE,
        false
      );
    }

    this.events = events || {};

    // Generate output file path
    const dir = this.outputDir || join(homedir(), '.mch', 'recordings');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.filePath = join(dir, `recording-${timestamp}.wav`);

    try {
      // Start recording
      this.recording = record.record({
        sampleRate: 16000,
        channels: 1,
        audioType: 'wav',
        recorder: 'sox', // Use sox for recording
      });

      const writeStream = createWriteStream(this.filePath);

      this.recording
        .stream()
        .on('data', (chunk: Buffer) => {
          this.events.onData?.(chunk);
        })
        .on('error', (err: Error) => {
          this.state = 'idle';

          // Check if sox is not found
          const message = err.message.toLowerCase();
          if (
            message.includes('sox') &&
            (message.includes('not found') ||
              message.includes('enoent') ||
              message.includes('spawn'))
          ) {
            const soxError = new RecordingError(
              'sox is not installed or not found in PATH',
              ErrorCode.RECORDING_SOX_NOT_FOUND,
              false,
              err
            );
            this.events.onError?.(soxError);
            return;
          }

          const recordingError = new RecordingError(
            `Recording error: ${err.message}`,
            ErrorCode.RECORDING_FAILED,
            true,
            err
          );
          this.events.onError?.(recordingError);
        })
        .pipe(writeStream);

      this.state = 'recording';
      this.startTime = Date.now();
      this.events.onStart?.();
    } catch (error) {
      this.state = 'idle';
      const originalError = error instanceof Error ? error : undefined;

      // Check if sox is not found
      const message = originalError?.message?.toLowerCase() ?? '';
      if (
        message.includes('sox') &&
        (message.includes('not found') ||
          message.includes('enoent') ||
          message.includes('spawn'))
      ) {
        throw new RecordingError(
          'sox is not installed or not found in PATH',
          ErrorCode.RECORDING_SOX_NOT_FOUND,
          false,
          originalError
        );
      }

      throw new RecordingError(
        `Failed to start recording: ${originalError?.message ?? 'Unknown error'}`,
        ErrorCode.RECORDING_FAILED,
        true,
        originalError
      );
    }
  }

  /**
   * Stop recording
   */
  stop(): string | null {
    if (this.state !== 'recording' || !this.recording) {
      return null;
    }

    this.recording.stop();
    this.state = 'stopped';

    const filePath = this.filePath;
    this.events.onStop?.(filePath!);

    // Reset state
    this.recording = null;
    this.startTime = null;

    return filePath;
  }

  /**
   * Get current recording state
   */
  getState(): RecordingState {
    return this.state;
  }

  /**
   * Get recording duration in seconds
   */
  getDuration(): number {
    if (!this.startTime || this.state !== 'recording') {
      return 0;
    }
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}
