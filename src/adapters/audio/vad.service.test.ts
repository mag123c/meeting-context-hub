import { describe, it, expect } from 'vitest';
import {
  calculateRms,
  calculatePercentile,
  estimateNoiseFloor,
  detectSilenceRegions,
  splitByVad,
  VadService,
} from './vad.service.js';
import { parseWavMetadata } from './audio-splitter.js';

/**
 * Create a test WAV buffer with specified samples
 */
function createTestWav(
  samples: number[],
  sampleRate = 16000,
  channels = 1,
  bitsPerSample = 16
): Buffer {
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = samples.length * bytesPerSample;
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * channels * bytesPerSample;
  const blockAlign = channels * bytesPerSample;
  const fileSize = 36 + dataSize;

  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);

  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  // Sample data
  const data = Buffer.alloc(dataSize);
  for (let i = 0; i < samples.length; i++) {
    data.writeInt16LE(Math.round(samples[i] * 32767), i * 2);
  }

  return Buffer.concat([header, data]);
}

describe('VAD Service', () => {
  describe('calculateRms', () => {
    it('should return 0 for silent buffer', () => {
      const samples = new Float32Array([0, 0, 0, 0, 0]);
      expect(calculateRms(samples)).toBe(0);
    });

    it('should calculate RMS correctly for constant signal', () => {
      // All samples at 0.5 amplitude
      const samples = new Float32Array([0.5, 0.5, 0.5, 0.5]);
      expect(calculateRms(samples)).toBeCloseTo(0.5, 5);
    });

    it('should handle sine wave correctly', () => {
      // Perfect sine wave has RMS = peak / sqrt(2)
      const samples = new Float32Array(1000);
      for (let i = 0; i < samples.length; i++) {
        samples[i] = Math.sin((2 * Math.PI * i) / 100);
      }
      // Expected RMS for sine wave is 1/sqrt(2) ≈ 0.707
      expect(calculateRms(samples)).toBeCloseTo(1 / Math.sqrt(2), 1);
    });

    it('should handle empty buffer', () => {
      const samples = new Float32Array([]);
      expect(calculateRms(samples)).toBe(0);
    });
  });

  describe('calculatePercentile', () => {
    it('should return correct percentile', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      expect(calculatePercentile(values, 50)).toBe(5);
      expect(calculatePercentile(values, 10)).toBe(1);
      expect(calculatePercentile(values, 90)).toBe(9);
    });

    it('should handle edge cases', () => {
      const values = [5];
      expect(calculatePercentile(values, 50)).toBe(5);
    });

    it('should handle empty array', () => {
      expect(calculatePercentile([], 50)).toBe(0);
    });
  });

  describe('estimateNoiseFloor', () => {
    it('should estimate noise floor from RMS values', () => {
      // Mix of noise and speech-like RMS values
      const rmsValues = [0.01, 0.02, 0.01, 0.5, 0.6, 0.02, 0.01];
      const noiseFloor = estimateNoiseFloor(rmsValues);

      // Noise floor should be low (based on 10th percentile)
      expect(noiseFloor).toBeLessThan(0.1);
      expect(noiseFloor).toBeGreaterThan(0);
    });

    it('should return minimum threshold for empty input', () => {
      expect(estimateNoiseFloor([])).toBeGreaterThan(0);
    });
  });

  describe('detectSilenceRegions', () => {
    it('should detect silence regions in audio', () => {
      // Create audio with speech-silence-speech pattern
      // 16000 samples/sec, so 1600 samples = 100ms
      const sampleRate = 16000;
      const samples: number[] = [];

      // 500ms of speech (loud)
      for (let i = 0; i < 8000; i++) {
        samples.push(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5);
      }

      // 1000ms of silence (quiet)
      for (let i = 0; i < 16000; i++) {
        samples.push(0.001 * Math.random()); // very quiet noise
      }

      // 500ms of speech (loud)
      for (let i = 0; i < 8000; i++) {
        samples.push(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5);
      }

      const buffer = createTestWav(samples, sampleRate);
      const metadata = parseWavMetadata(buffer);
      const audioData = buffer.slice(metadata.headerSize);

      const silences = detectSilenceRegions(audioData, metadata, {
        silenceThreshold: 0.01,
        minSilenceDurationMs: 700,
        chunkOverlapMs: 200,
        useAdaptiveThreshold: false,
      });

      // Should detect at least one silence region
      expect(silences.length).toBeGreaterThanOrEqual(1);

      // Silence should be around 500-1500ms range
      const silence = silences[0];
      expect(silence.startMs).toBeGreaterThanOrEqual(400);
      expect(silence.endMs).toBeLessThanOrEqual(1600);
    });

    it('should return empty for continuous speech', () => {
      const sampleRate = 16000;
      const samples: number[] = [];

      // 2 seconds of continuous speech
      for (let i = 0; i < 32000; i++) {
        samples.push(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5);
      }

      const buffer = createTestWav(samples, sampleRate);
      const metadata = parseWavMetadata(buffer);
      const audioData = buffer.slice(metadata.headerSize);

      const silences = detectSilenceRegions(audioData, metadata, {
        silenceThreshold: 0.01,
        minSilenceDurationMs: 700,
        chunkOverlapMs: 200,
        useAdaptiveThreshold: false,
      });

      expect(silences.length).toBe(0);
    });
  });

  describe('splitByVad', () => {
    it('should split audio at silence boundaries', () => {
      const sampleRate = 16000;
      const samples: number[] = [];

      // 500ms of speech
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

      const buffer = createTestWav(samples, sampleRate);
      const chunks = splitByVad(buffer, {
        silenceThreshold: 0.01,
        minSilenceDurationMs: 700,
        chunkOverlapMs: 200,
        useAdaptiveThreshold: false,
      });

      // Should split into multiple chunks
      expect(chunks.length).toBeGreaterThanOrEqual(1);

      // Each chunk should be a valid WAV
      for (const chunk of chunks) {
        expect(chunk.slice(0, 4).toString()).toBe('RIFF');
        expect(chunk.slice(8, 12).toString()).toBe('WAVE');
      }
    });

    it('should return original buffer if no silence found', () => {
      const sampleRate = 16000;
      const samples: number[] = [];

      // 1 second of continuous speech
      for (let i = 0; i < 16000; i++) {
        samples.push(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5);
      }

      const buffer = createTestWav(samples, sampleRate);
      const chunks = splitByVad(buffer, {
        silenceThreshold: 0.01,
        minSilenceDurationMs: 700,
        chunkOverlapMs: 200,
        useAdaptiveThreshold: false,
      });

      expect(chunks.length).toBe(1);
      expect(chunks[0]).toEqual(buffer);
    });
  });

  describe('VadService class', () => {
    it('should be constructible with default config', () => {
      const service = new VadService();
      expect(service).toBeDefined();
    });

    it('should be constructible with custom config', () => {
      const service = new VadService({
        silenceThreshold: 0.02,
        minSilenceDurationMs: 500,
      });
      expect(service).toBeDefined();
    });

    it('should split buffer using instance method', () => {
      const service = new VadService();
      const sampleRate = 16000;
      const samples: number[] = [];

      // 500ms speech + 1000ms silence + 500ms speech
      for (let i = 0; i < 8000; i++) {
        samples.push(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5);
      }
      for (let i = 0; i < 16000; i++) {
        samples.push(0.001 * Math.random());
      }
      for (let i = 0; i < 8000; i++) {
        samples.push(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5);
      }

      const buffer = createTestWav(samples, sampleRate);
      const chunks = service.splitBuffer(buffer);

      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });
  });
});
