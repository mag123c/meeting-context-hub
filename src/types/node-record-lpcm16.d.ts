declare module 'node-record-lpcm16' {
  import type { Readable } from 'stream';

  interface RecordOptions {
    sampleRate?: number;
    channels?: number;
    audioType?: string;
    recorder?: string;
    threshold?: number;
    thresholdStart?: number | null;
    thresholdEnd?: number | null;
    silence?: string;
    device?: string | null;
    endOnSilence?: boolean;
    silenceTimeout?: number;
  }

  interface Recording {
    stream(): Readable;
    stop(): void;
    pause(): void;
    resume(): void;
    isPaused(): boolean;
  }

  function record(options?: RecordOptions): Recording;

  export = { record };
}
