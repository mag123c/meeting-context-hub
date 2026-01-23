import {
  openSync,
  readSync,
  writeSync,
  closeSync,
  statSync,
  mkdtempSync,
  existsSync,
  unlinkSync,
} from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";

// Whisper API limit
const MAX_CHUNK_SIZE = 25 * 1024 * 1024; // 25MB
// Safe chunk size (with margin)
const TARGET_CHUNK_SIZE = 20 * 1024 * 1024; // 20MB

interface WavHeader {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  dataSize: number;
  dataOffset: number;
  bytesPerSecond: number;
}

/**
 * Parse WAV header to extract audio format info
 */
function parseWavHeader(filePath: string): WavHeader {
  const fd = openSync(filePath, "r");
  const buffer = Buffer.alloc(44);
  readSync(fd, buffer, 0, 44, 0);

  // Verify RIFF header
  const riff = buffer.toString("ascii", 0, 4);
  const wave = buffer.toString("ascii", 8, 12);
  if (riff !== "RIFF" || wave !== "WAVE") {
    closeSync(fd);
    throw new Error("Invalid WAV file format");
  }

  // Find data chunk (may not be at offset 36)
  let dataOffset = 12;
  let dataSize = 0;

  // Read chunks until we find "data"
  const chunkBuffer = Buffer.alloc(8);
  while (dataOffset < 200) {
    // Reasonable limit
    readSync(fd, chunkBuffer, 0, 8, dataOffset);
    const chunkId = chunkBuffer.toString("ascii", 0, 4);
    const chunkSize = chunkBuffer.readUInt32LE(4);

    if (chunkId === "data") {
      dataSize = chunkSize;
      dataOffset += 8; // Move past chunk header to actual data
      break;
    }

    dataOffset += 8 + chunkSize;
  }

  closeSync(fd);

  if (dataSize === 0) {
    throw new Error("Could not find data chunk in WAV file");
  }

  // Extract format info from standard positions
  const channels = buffer.readUInt16LE(22);
  const sampleRate = buffer.readUInt32LE(24);
  const bitsPerSample = buffer.readUInt16LE(34);
  const bytesPerSecond = sampleRate * channels * (bitsPerSample / 8);

  return {
    sampleRate,
    channels,
    bitsPerSample,
    dataSize,
    dataOffset,
    bytesPerSecond,
  };
}

/**
 * Create WAV header for a chunk
 */
function createWavHeader(header: WavHeader, dataSize: number): Buffer {
  const buffer = Buffer.alloc(44);

  // RIFF header
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");

  // fmt chunk
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(header.channels, 22);
  buffer.writeUInt32LE(header.sampleRate, 24);
  buffer.writeUInt32LE(header.bytesPerSecond, 28);
  buffer.writeUInt16LE(header.channels * (header.bitsPerSample / 8), 32); // block align
  buffer.writeUInt16LE(header.bitsPerSample, 34);

  // data chunk
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

/**
 * Split a large WAV file into smaller chunks for Whisper API
 * Returns array of chunk file paths (in temp directory)
 */
export async function splitWavFile(filePath: string): Promise<string[]> {
  const stats = statSync(filePath);

  // If file is already small enough, return as-is
  if (stats.size <= MAX_CHUNK_SIZE) {
    return [filePath];
  }

  const header = parseWavHeader(filePath);

  // Calculate chunk size based on target
  const maxDataPerChunk = TARGET_CHUNK_SIZE - 44; // Account for header
  const secondsPerChunk = Math.floor(maxDataPerChunk / header.bytesPerSecond);
  const bytesPerChunk = secondsPerChunk * header.bytesPerSecond;

  // Create temp directory for chunks
  const tempDir = mkdtempSync(join(tmpdir(), "mch-audio-split-"));
  const chunks: string[] = [];

  const fd = openSync(filePath, "r");

  try {
    let offset = header.dataOffset;
    let remaining = header.dataSize;
    let chunkIndex = 0;

    while (remaining > 0) {
      const chunkDataSize = Math.min(bytesPerChunk, remaining);
      const chunkPath = join(tempDir, `chunk-${chunkIndex}.wav`);

      // Create chunk file
      const chunkFd = openSync(chunkPath, "w");

      // Write WAV header
      const chunkHeader = createWavHeader(header, chunkDataSize);
      writeSync(chunkFd, chunkHeader, 0, 44, 0);

      // Copy audio data in 64KB blocks
      const blockSize = 64 * 1024;
      let written = 0;
      const readBuffer = Buffer.alloc(blockSize);

      while (written < chunkDataSize) {
        const toRead = Math.min(blockSize, chunkDataSize - written);
        const bytesRead = readSync(fd, readBuffer, 0, toRead, offset + written);
        if (bytesRead === 0) break;
        writeSync(chunkFd, readBuffer, 0, bytesRead, 44 + written);
        written += bytesRead;
      }

      closeSync(chunkFd);
      chunks.push(chunkPath);

      offset += chunkDataSize;
      remaining -= chunkDataSize;
      chunkIndex++;
    }
  } finally {
    closeSync(fd);
  }

  return chunks;
}

/**
 * Check if ffmpeg is available (for non-WAV formats)
 */
export function isFfmpegAvailable(): boolean {
  try {
    execSync("which ffmpeg", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Split audio file using ffmpeg (for MP3, M4A, etc.)
 * Falls back to this when WAV split is not possible
 */
export async function splitAudioWithFfmpeg(
  filePath: string,
  segmentDuration: number = 600 // 10 minutes
): Promise<string[]> {
  if (!isFfmpegAvailable()) {
    throw new Error(
      "ffmpeg is required to split non-WAV audio files. Install with: brew install ffmpeg"
    );
  }

  const tempDir = mkdtempSync(join(tmpdir(), "mch-audio-split-"));
  const outputPattern = join(tempDir, "chunk-%03d.wav");

  // Convert to WAV and split
  execSync(
    `ffmpeg -i "${filePath}" -f segment -segment_time ${segmentDuration} -ar 16000 -ac 1 -acodec pcm_s16le "${outputPattern}"`,
    { stdio: "pipe" }
  );

  // Find all generated chunks
  const chunks: string[] = [];
  let i = 0;
  while (true) {
    const chunkPath = join(tempDir, `chunk-${String(i).padStart(3, "0")}.wav`);
    if (!existsSync(chunkPath)) break;
    chunks.push(chunkPath);
    i++;
  }

  return chunks;
}

/**
 * Clean up temporary chunk files
 */
export function cleanupChunks(chunkPaths: string[]): void {
  for (const path of chunkPaths) {
    try {
      if (existsSync(path)) {
        unlinkSync(path);
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Check if file needs splitting based on size
 */
export function needsSplitting(filePath: string): boolean {
  const stats = statSync(filePath);
  return stats.size > MAX_CHUNK_SIZE;
}

/**
 * Get estimated chunk count for a file
 */
export function getEstimatedChunkCount(filePath: string): number {
  const stats = statSync(filePath);
  if (stats.size <= MAX_CHUNK_SIZE) return 1;
  return Math.ceil(stats.size / TARGET_CHUNK_SIZE);
}
