import record from 'node-record-lpcm16';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

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
      throw new Error('Already recording');
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

      this.recording.stream()
        .on('data', (chunk: Buffer) => {
          this.events.onData?.(chunk);
        })
        .on('error', (err: Error) => {
          this.state = 'idle';
          this.events.onError?.(err);
        })
        .pipe(writeStream);

      this.state = 'recording';
      this.startTime = Date.now();
      this.events.onStart?.();
    } catch (error) {
      this.state = 'idle';
      throw new Error(
        `Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`
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

/**
 * Recording error
 */
export class RecordingError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'RecordingError';
  }
}
