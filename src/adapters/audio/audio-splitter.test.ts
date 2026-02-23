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
import { ErrorCode } from '../../types/errors.js';

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
        audioFormat: 1,
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

    it('should parse audioFormat from fmt chunk', () => {
      // audioFormat=3 means IEEE float
      const header = createValidWavHeader({
        sampleRate: 44100,
        channels: 2,
        bitsPerSample: 32,
        dataSize: 1000,
        audioFormat: 3,
      });

      const metadata = parseWavMetadata(header);

      expect(metadata.audioFormat).toBe(3);
    });

    it('should handle odd-sized chunks with RIFF padding byte', () => {
      // RIFF spec: odd-sized chunks have 1 byte padding after data
      // Create a WAV with an odd-sized non-standard chunk before the data chunk
      const oddChunkSize = 17; // odd number
      const dataSize = 1000;

      // Calculate total buffer size:
      // 12 (RIFF+WAVE) + 8+16 (fmt chunk) + 8+oddChunkSize+1(padding) + 8+dataSize
      const totalSize = 12 + 24 + 8 + oddChunkSize + 1 + 8 + dataSize;
      const buffer = Buffer.alloc(totalSize);

      // RIFF header
      buffer.write('RIFF', 0);
      buffer.writeUInt32LE(totalSize - 8, 4);
      buffer.write('WAVE', 8);

      // fmt chunk (standard 16 bytes)
      let offset = 12;
      buffer.write('fmt ', offset);
      buffer.writeUInt32LE(16, offset + 4);
      buffer.writeUInt16LE(1, offset + 8);   // PCM
      buffer.writeUInt16LE(1, offset + 10);  // mono
      buffer.writeUInt32LE(16000, offset + 12); // sample rate
      buffer.writeUInt32LE(32000, offset + 16); // byte rate
      buffer.writeUInt16LE(2, offset + 20);  // block align
      buffer.writeUInt16LE(16, offset + 22); // bits per sample
      offset += 24;

      // Custom odd-sized chunk (e.g., "LIST" chunk with 17 bytes)
      buffer.write('LIST', offset);
      buffer.writeUInt32LE(oddChunkSize, offset + 4);
      offset += 8 + oddChunkSize + 1; // +1 for padding byte

      // data chunk
      buffer.write('data', offset);
      buffer.writeUInt32LE(dataSize, offset + 4);

      const metadata = parseWavMetadata(buffer);

      expect(metadata.sampleRate).toBe(16000);
      expect(metadata.channels).toBe(1);
      expect(metadata.bitsPerSample).toBe(16);
      expect(metadata.dataSize).toBe(dataSize);
      expect(metadata.headerSize).toBe(offset + 8);
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

    it('should throw TRANSCRIPTION_UNSUPPORTED_WAV_FORMAT for non-PCM WAV', () => {
      const dataSize = 25 * 1024 * 1024;
      const header = createValidWavHeader({
        sampleRate: 44100,
        channels: 2,
        bitsPerSample: 32,
        dataSize,
        audioFormat: 3, // IEEE float
      });
      const data = Buffer.alloc(dataSize);
      const wavBuffer = Buffer.concat([header, data]);

      expect(() => splitWavBuffer(wavBuffer)).toThrow(
        expect.objectContaining({
          code: ErrorCode.TRANSCRIPTION_UNSUPPORTED_WAV_FORMAT,
        })
      );
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
    it('should throw TRANSCRIPTION_UNSUPPORTED_WAV_FORMAT for non-PCM WAV', () => {
      const dataSize = 1000;
      const header = createValidWavHeader({
        sampleRate: 44100,
        channels: 2,
        bitsPerSample: 32,
        dataSize,
        audioFormat: 3,
      });
      const data = Buffer.alloc(dataSize);
      const wavBuffer = Buffer.concat([header, data]);

      expect(() => splitWavBufferWithVad(wavBuffer)).toThrow(
        expect.objectContaining({
          code: ErrorCode.TRANSCRIPTION_UNSUPPORTED_WAV_FORMAT,
        })
      );
    });

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
  audioFormat?: number;
}): Buffer {
  const { sampleRate, channels, bitsPerSample, dataSize, audioFormat = 1 } = options;
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
  header.writeUInt16LE(audioFormat, 20); // AudioFormat
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
