/**
 * Type declarations for whisper-node
 */
declare module 'whisper-node' {
  interface WhisperOptions {
    modelPath: string;
    whisperOptions?: {
      language?: string;
      word_timestamps?: boolean;
      initial_prompt?: string;
    };
  }

  interface WhisperSegment {
    start: number;
    end: number;
    speech: string;
  }

  export default function whisper(
    filePath: string,
    options: WhisperOptions
  ): Promise<WhisperSegment[]>;
}
