import { describe, it, expect } from 'vitest';
import {
  parseWavMetadata,
  needsSplit,
  splitWavBuffer,
  mergeTranscriptions,
  mergeTranscriptionsWithOverlap,
  splitWavBufferWithVad,
  MAX_CHUNK_SIZE,
} from './audio-splitter.js';

describe('AudioSplitter', () => {
  describe('parseWavMetadata', () => {
    it('should parse valid WAV header', () => {
      // Create a minimal valid WAV header (44 bytes)
      const header = createValidWavHeader({
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        dataSize: 32000,
      });

      const metadata = parseWavMetadata(header);

      expect(metadata).toEqual({
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        dataSize: 32000,
        headerSize: 44,
      });
    });

    it('should throw error for invalid WAV (wrong RIFF)', () => {
      const invalidBuffer = Buffer.from('NOT_RIFF_FILE_DATA_HERE!!!!!!!!!!!!!!!!!!!!!');

      expect(() => parseWavMetadata(invalidBuffer)).toThrow('Invalid WAV file: missing RIFF header');
    });

    it('should throw error for invalid WAV (wrong WAVE)', () => {
      const buffer = Buffer.alloc(44);
      buffer.write('RIFF', 0);
      buffer.write('XXXX', 8); // Should be WAVE

      expect(() => parseWavMetadata(buffer)).toThrow('Invalid WAV file: missing WAVE format');
    });

    it('should throw error for buffer too small', () => {
      const smallBuffer = Buffer.alloc(10);

      expect(() => parseWavMetadata(smallBuffer)).toThrow('Invalid WAV file: buffer too small');
    });
  });

  describe('needsSplit', () => {
    it('should return false for files under 20MB', () => {
      expect(needsSplit(10 * 1024 * 1024)).toBe(false); // 10MB
      expect(needsSplit(19 * 1024 * 1024)).toBe(false); // 19MB
      expect(needsSplit(MAX_CHUNK_SIZE)).toBe(false); // Exactly 20MB
    });

    it('should return true for files over 20MB', () => {
      expect(needsSplit(21 * 1024 * 1024)).toBe(true); // 21MB
      expect(needsSplit(25 * 1024 * 1024)).toBe(true); // 25MB
      expect(needsSplit(50 * 1024 * 1024)).toBe(true); // 50MB
    });
  });

  describe('splitWavBuffer', () => {
    it('should return single chunk for small files', () => {
      // Create a 1MB WAV file
      const dataSize = 1 * 1024 * 1024;
      const header = createValidWavHeader({
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        dataSize,
      });
      const data = Buffer.alloc(dataSize);
      const wavBuffer = Buffer.concat([header, data]);

      const chunks = splitWavBuffer(wavBuffer);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].length).toBe(wavBuffer.length);
    });

    it('should split large files into multiple chunks', () => {
      // Create a 45MB WAV file (should split into 3 chunks)
      const dataSize = 45 * 1024 * 1024;
      const header = createValidWavHeader({
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        dataSize,
      });
      const data = Buffer.alloc(dataSize);
      const wavBuffer = Buffer.concat([header, data]);

      const chunks = splitWavBuffer(wavBuffer);

      // Should be 3 chunks (45MB / 20MB = 2.25 -> 3 chunks)
      expect(chunks).toHaveLength(3);

      // Each chunk should be a valid WAV file with header
      chunks.forEach((chunk) => {
        expect(chunk.slice(0, 4).toString()).toBe('RIFF');
        expect(chunk.slice(8, 12).toString()).toBe('WAVE');
      });
    });

    it('should align chunks to sample boundaries', () => {
      // 16-bit mono = 2 bytes per sample
      // Chunks should be aligned to frame boundaries
      const dataSize = 25 * 1024 * 1024; // 25MB, will split
      const header = createValidWavHeader({
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        dataSize,
      });
      const data = Buffer.alloc(dataSize);
      const wavBuffer = Buffer.concat([header, data]);

      const chunks = splitWavBuffer(wavBuffer);

      // Each chunk's data size should be divisible by frame size (2 bytes for 16-bit mono)
      chunks.forEach((chunk) => {
        const chunkMetadata = parseWavMetadata(chunk);
        const frameSize = (chunkMetadata.bitsPerSample / 8) * chunkMetadata.channels;
        expect(chunkMetadata.dataSize % frameSize).toBe(0);
      });
    });

    it('should preserve audio format in all chunks', () => {
      const dataSize = 22 * 1024 * 1024;
      const header = createValidWavHeader({
        sampleRate: 44100,
        channels: 2,
        bitsPerSample: 16,
        dataSize,
      });
      const data = Buffer.alloc(dataSize);
      const wavBuffer = Buffer.concat([header, data]);

      const chunks = splitWavBuffer(wavBuffer);

      chunks.forEach((chunk) => {
        const chunkMetadata = parseWavMetadata(chunk);
        expect(chunkMetadata.sampleRate).toBe(44100);
        expect(chunkMetadata.channels).toBe(2);
        expect(chunkMetadata.bitsPerSample).toBe(16);
      });
    });
  });

  describe('mergeTranscriptions', () => {
    it('should merge multiple transcriptions with space', () => {
      const transcriptions = [
        'Hello, this is the first part.',
        'And this is the second part.',
        'Finally, the third part.',
      ];

      const merged = mergeTranscriptions(transcriptions);

      expect(merged).toBe(
        'Hello, this is the first part. And this is the second part. Finally, the third part.'
      );
    });

    it('should handle single transcription', () => {
      const transcriptions = ['Single transcription.'];

      const merged = mergeTranscriptions(transcriptions);

      expect(merged).toBe('Single transcription.');
    });

    it('should handle empty array', () => {
      const merged = mergeTranscriptions([]);

      expect(merged).toBe('');
    });

    it('should trim whitespace from each transcription', () => {
      const transcriptions = ['  Hello  ', '  World  '];

      const merged = mergeTranscriptions(transcriptions);

      expect(merged).toBe('Hello World');
    });

    it('should filter out empty transcriptions', () => {
      const transcriptions = ['Hello', '', '  ', 'World'];

      const merged = mergeTranscriptions(transcriptions);

      expect(merged).toBe('Hello World');
    });
  });

  describe('mergeTranscriptionsWithOverlap', () => {
    it('should remove duplicate phrases at boundaries', () => {
      const transcriptions = [
        '안녕하세요 오늘 회의를 시작하겠습니다',
        '회의를 시작하겠습니다 첫 번째 안건은',
        '첫 번째 안건은 프로젝트 진행 상황입니다',
      ];

      const merged = mergeTranscriptionsWithOverlap(transcriptions);

      // Should remove duplicated "회의를 시작하겠습니다" and "첫 번째 안건은"
      expect(merged).not.toContain('회의를 시작하겠습니다 회의를 시작하겠습니다');
      expect(merged).not.toContain('첫 번째 안건은 첫 번째 안건은');
    });

    it('should handle no overlap', () => {
      const transcriptions = ['Hello world', 'Goodbye world'];

      const merged = mergeTranscriptionsWithOverlap(transcriptions);

      expect(merged).toBe('Hello world Goodbye world');
    });

    it('should handle single transcription', () => {
      const merged = mergeTranscriptionsWithOverlap(['Single text']);

      expect(merged).toBe('Single text');
    });

    it('should handle empty array', () => {
      const merged = mergeTranscriptionsWithOverlap([]);

      expect(merged).toBe('');
    });
  });

  describe('splitWavBufferWithVad', () => {
    it('should use VAD-based splitting', () => {
      // Create audio with speech-silence-speech pattern
      const sampleRate = 16000;
      const samples: number[] = [];

      // 500ms of speech (440Hz tone)
      for (let i = 0; i < 8000; i++) {
        samples.push(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5);
      }

      // 1000ms of silence
      for (let i = 0; i < 16000; i++) {
        samples.push(0.001 * Math.random());
      }

      // 500ms of speech
      for (let i = 0; i < 8000; i++) {
        samples.push(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5);
      }

      const buffer = createTestWavWithSamples(samples, sampleRate);
      const chunks = splitWavBufferWithVad(buffer);

      // Should split at silence
      expect(chunks.length).toBeGreaterThanOrEqual(1);

      // Each chunk should be valid WAV
      for (const chunk of chunks) {
        expect(chunk.slice(0, 4).toString()).toBe('RIFF');
        expect(chunk.slice(8, 12).toString()).toBe('WAVE');
      }
    });

    it('should fall back to size-based splitting for large files', () => {
      // Create a large file (25MB) with continuous audio
      const dataSize = 25 * 1024 * 1024;
      const header = createValidWavHeader({
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        dataSize,
      });
      const data = Buffer.alloc(dataSize);

      // Fill with non-zero values to prevent VAD from splitting
      for (let i = 0; i < dataSize; i += 2) {
        data.writeInt16LE(Math.floor(Math.random() * 10000), i);
      }

      const wavBuffer = Buffer.concat([header, data]);
      const chunks = splitWavBufferWithVad(wavBuffer);

      // Should split due to size limit
      expect(chunks.length).toBeGreaterThan(1);

      // Each chunk should be under max size
      for (const chunk of chunks) {
        expect(chunk.length).toBeLessThanOrEqual(MAX_CHUNK_SIZE);
      }
    });
  });
});

/**
 * Helper to create a WAV buffer from sample values
 */
function createTestWavWithSamples(
  samples: number[],
  sampleRate = 16000,
  channels = 1,
  bitsPerSample = 16
): Buffer {
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = samples.length * bytesPerSample;
  const header = createValidWavHeader({
    sampleRate,
    channels,
    bitsPerSample,
    dataSize,
  });

  const data = Buffer.alloc(dataSize);
  for (let i = 0; i < samples.length; i++) {
    data.writeInt16LE(Math.round(samples[i] * 32767), i * 2);
  }

  return Buffer.concat([header, data]);
}

/**
 * Helper to create a valid WAV header
 */
function createValidWavHeader(options: {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  dataSize: number;
}): Buffer {
  const { sampleRate, channels, bitsPerSample, dataSize } = options;
  const header = Buffer.alloc(44);

  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const fileSize = 36 + dataSize;

  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);

  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size for PCM
  header.writeUInt16LE(1, 20); // AudioFormat: PCM = 1
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return header;
}
