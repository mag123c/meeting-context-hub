/**
 * Voice Activity Detection (VAD) Service
 *
 * Detects speech segments in audio for intelligent chunking.
 * Uses RMS-based silence detection with adaptive noise floor estimation.
 */

import type { VadConfig, VadSegment } from './whisper.types.js';
import { DEFAULT_VAD_CONFIG } from './whisper.types.js';
import { parseWavMetadata, type WavMetadata } from './audio-splitter.js';

/**
 * Calculate Root Mean Square (RMS) of audio samples
 * RMS represents the "loudness" of the audio segment
 */
export function calculateRms(samples: Float32Array): number {
  if (samples.length === 0) {
    return 0;
  }

  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }

  return Math.sqrt(sum / samples.length);
}

/**
 * Calculate the nth percentile of an array of values
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor((percentile / 100) * (sorted.length - 1));
  return sorted[index];
}

/**
 * Estimate noise floor from RMS values using adaptive threshold
 * Uses 10th percentile as base noise level
 */
export function estimateNoiseFloor(rmsValues: number[]): number {
  if (rmsValues.length === 0) {
    return DEFAULT_VAD_CONFIG.silenceThreshold;
  }

  const percentile10 = calculatePercentile(rmsValues, 10);
  // Multiply by 3.0 to get threshold above noise floor
  const adaptiveThreshold = percentile10 * 3.0;

  // Ensure minimum threshold
  return Math.max(adaptiveThreshold, DEFAULT_VAD_CONFIG.silenceThreshold * 0.5);
}

/**
 * Convert 16-bit PCM buffer to Float32Array samples
 */
function pcmToFloat32(buffer: Buffer, bitsPerSample: number): Float32Array {
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = buffer.length / bytesPerSample;
  const samples = new Float32Array(numSamples);

  if (bitsPerSample === 16) {
    for (let i = 0; i < numSamples; i++) {
      const int16 = buffer.readInt16LE(i * 2);
      samples[i] = int16 / 32768; // Normalize to -1.0 to 1.0
    }
  } else if (bitsPerSample === 8) {
    for (let i = 0; i < numSamples; i++) {
      const uint8 = buffer.readUInt8(i);
      samples[i] = (uint8 - 128) / 128; // Normalize to -1.0 to 1.0
    }
  }

  return samples;
}

/**
 * Detect silence regions in audio data
 * Returns array of silence segments with start/end times in ms
 */
export function detectSilenceRegions(
  audioData: Buffer,
  metadata: WavMetadata,
  config: VadConfig
): VadSegment[] {
  const samples = pcmToFloat32(audioData, metadata.bitsPerSample);

  // Analyze in 20ms frames (common for speech processing)
  const frameSizeMs = 20;
  const samplesPerFrame = Math.floor((metadata.sampleRate * frameSizeMs) / 1000);
  const numFrames = Math.floor(samples.length / samplesPerFrame);

  if (numFrames === 0) {
    return [];
  }

  // Calculate RMS for each frame
  const rmsValues: number[] = [];
  for (let i = 0; i < numFrames; i++) {
    const start = i * samplesPerFrame;
    const frameSamples = samples.slice(start, start + samplesPerFrame);
    rmsValues.push(calculateRms(frameSamples));
  }

  // Determine threshold
  const threshold = config.useAdaptiveThreshold
    ? estimateNoiseFloor(rmsValues)
    : config.silenceThreshold;

  // Detect silence regions
  const silences: VadSegment[] = [];
  let silenceStart: number | null = null;
  let silenceRmsSum = 0;
  let silenceFrameCount = 0;

  for (let i = 0; i < numFrames; i++) {
    const isSilent = rmsValues[i] < threshold;
    const timeMs = i * frameSizeMs;

    if (isSilent) {
      if (silenceStart === null) {
        silenceStart = timeMs;
        silenceRmsSum = 0;
        silenceFrameCount = 0;
      }
      silenceRmsSum += rmsValues[i];
      silenceFrameCount++;
    } else {
      if (silenceStart !== null) {
        const silenceDuration = timeMs - silenceStart;
        if (silenceDuration >= config.minSilenceDurationMs) {
          silences.push({
            startMs: silenceStart,
            endMs: timeMs,
            avgRms: silenceRmsSum / silenceFrameCount,
          });
        }
        silenceStart = null;
      }
    }
  }

  // Handle trailing silence
  if (silenceStart !== null) {
    const endMs = numFrames * frameSizeMs;
    const silenceDuration = endMs - silenceStart;
    if (silenceDuration >= config.minSilenceDurationMs) {
      silences.push({
        startMs: silenceStart,
        endMs: endMs,
        avgRms: silenceRmsSum / silenceFrameCount,
      });
    }
  }

  return silences;
}

/**
 * Create a WAV header for a chunk
 */
function createWavHeader(metadata: WavMetadata, chunkDataSize: number): Buffer {
  const header = Buffer.alloc(44);
  const byteRate =
    metadata.sampleRate * metadata.channels * (metadata.bitsPerSample / 8);
  const blockAlign = metadata.channels * (metadata.bitsPerSample / 8);
  const fileSize = 36 + chunkDataSize;

  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);

  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(metadata.channels, 22);
  header.writeUInt32LE(metadata.sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(metadata.bitsPerSample, 34);

  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(chunkDataSize, 40);

  return header;
}

/**
 * Split WAV buffer by VAD (Voice Activity Detection)
 * Returns array of WAV buffers split at silence boundaries
 */
export function splitByVad(buffer: Buffer, config: VadConfig): Buffer[] {
  const metadata = parseWavMetadata(buffer);
  const audioData = buffer.slice(metadata.headerSize);

  const silences = detectSilenceRegions(audioData, metadata, config);

  // No silences found - return original buffer
  if (silences.length === 0) {
    return [buffer];
  }

  const chunks: Buffer[] = [];
  const bytesPerSample = metadata.bitsPerSample / 8;
  const bytesPerMs = (metadata.sampleRate * metadata.channels * bytesPerSample) / 1000;
  const frameSize = metadata.channels * bytesPerSample;

  let chunkStart = 0;

  for (const silence of silences) {
    // Find the middle of the silence region for clean split
    const splitPointMs = Math.floor((silence.startMs + silence.endMs) / 2);
    let splitPointBytes = Math.floor(splitPointMs * bytesPerMs);

    // Align to frame boundary
    splitPointBytes = Math.floor(splitPointBytes / frameSize) * frameSize;

    // Add overlap before split point (prevents word cutoff)
    const overlapBytes = Math.floor(config.chunkOverlapMs * bytesPerMs);
    const chunkEndBytes = Math.min(splitPointBytes + overlapBytes, audioData.length);

    // Align chunk end to frame boundary
    const alignedChunkEnd = Math.floor(chunkEndBytes / frameSize) * frameSize;

    if (alignedChunkEnd > chunkStart && alignedChunkEnd <= audioData.length) {
      const chunkData = audioData.slice(chunkStart, alignedChunkEnd);
      const chunkHeader = createWavHeader(metadata, chunkData.length);
      chunks.push(Buffer.concat([chunkHeader, chunkData]));

      // Start next chunk slightly before split point (overlap)
      const nextStart = Math.max(0, splitPointBytes - overlapBytes);
      chunkStart = Math.floor(nextStart / frameSize) * frameSize;
    }
  }

  // Add final chunk if there's remaining data
  if (chunkStart < audioData.length) {
    const remainingData = audioData.slice(chunkStart);
    const alignedSize = Math.floor(remainingData.length / frameSize) * frameSize;

    if (alignedSize > 0) {
      const chunkData = remainingData.slice(0, alignedSize);
      const chunkHeader = createWavHeader(metadata, chunkData.length);
      chunks.push(Buffer.concat([chunkHeader, chunkData]));
    }
  }

  return chunks.length > 0 ? chunks : [buffer];
}

/**
 * VAD Service class for reusable VAD operations
 */
export class VadService {
  private config: VadConfig;

  constructor(config: Partial<VadConfig> = {}) {
    this.config = { ...DEFAULT_VAD_CONFIG, ...config };
  }

  /**
   * Split buffer using VAD
   */
  splitBuffer(buffer: Buffer): Buffer[] {
    return splitByVad(buffer, this.config);
  }

  /**
   * Detect silence regions in buffer
   */
  detectSilences(buffer: Buffer): VadSegment[] {
    const metadata = parseWavMetadata(buffer);
    const audioData = buffer.slice(metadata.headerSize);
    return detectSilenceRegions(audioData, metadata, this.config);
  }
}
