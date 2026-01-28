/**
 * Audio Splitter Utility
 *
 * Splits large WAV files into smaller chunks for Whisper API (25MB limit)
 */

export const MAX_CHUNK_SIZE = 20 * 1024 * 1024; // 20MB (safe margin under 25MB limit)

/**
 * WAV file metadata
 */
export interface WavMetadata {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  dataSize: number;
  headerSize: number;
}

/**
 * Parse WAV header and extract metadata
 */
export function parseWavMetadata(buffer: Buffer): WavMetadata {
  if (buffer.length < 44) {
    throw new Error('Invalid WAV file: buffer too small');
  }

  // Check RIFF header
  if (buffer.slice(0, 4).toString() !== 'RIFF') {
    throw new Error('Invalid WAV file: missing RIFF header');
  }

  // Check WAVE format
  if (buffer.slice(8, 12).toString() !== 'WAVE') {
    throw new Error('Invalid WAV file: missing WAVE format');
  }

  // Find fmt chunk (usually at byte 12, but can vary)
  let offset = 12;
  let fmtChunkFound = false;
  let channels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;

  while (offset < buffer.length - 8) {
    const chunkId = buffer.slice(offset, offset + 4).toString();
    const chunkSize = buffer.readUInt32LE(offset + 4);

    if (chunkId === 'fmt ') {
      fmtChunkFound = true;
      channels = buffer.readUInt16LE(offset + 10);
      sampleRate = buffer.readUInt32LE(offset + 12);
      bitsPerSample = buffer.readUInt16LE(offset + 22);
    }

    if (chunkId === 'data') {
      return {
        sampleRate,
        channels,
        bitsPerSample,
        dataSize: chunkSize,
        headerSize: offset + 8,
      };
    }

    offset += 8 + chunkSize;
  }

  // Fallback for standard 44-byte header
  if (!fmtChunkFound) {
    channels = buffer.readUInt16LE(22);
    sampleRate = buffer.readUInt32LE(24);
    bitsPerSample = buffer.readUInt16LE(34);
  }

  const dataSize = buffer.readUInt32LE(40);

  return {
    sampleRate,
    channels,
    bitsPerSample,
    dataSize,
    headerSize: 44,
  };
}

/**
 * Check if file needs to be split based on size
 */
export function needsSplit(fileSizeBytes: number): boolean {
  return fileSizeBytes > MAX_CHUNK_SIZE;
}

/**
 * Create a WAV header for a chunk
 */
function createWavHeader(
  metadata: WavMetadata,
  chunkDataSize: number
): Buffer {
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
  header.writeUInt32LE(16, 16); // Subchunk1Size for PCM
  header.writeUInt16LE(1, 20); // AudioFormat: PCM = 1
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
 * Split a WAV buffer into multiple chunks
 * Each chunk is a valid WAV file with proper headers
 */
export function splitWavBuffer(buffer: Buffer): Buffer[] {
  const metadata = parseWavMetadata(buffer);

  // If file is small enough, return as-is
  if (!needsSplit(buffer.length)) {
    return [buffer];
  }

  const chunks: Buffer[] = [];
  const frameSize = metadata.channels * (metadata.bitsPerSample / 8);
  const headerSize = metadata.headerSize;
  const audioData = buffer.slice(headerSize);

  // Calculate max data size per chunk (leave room for header)
  const maxDataPerChunk = MAX_CHUNK_SIZE - 44;
  // Align to frame boundary
  const alignedMaxDataPerChunk =
    Math.floor(maxDataPerChunk / frameSize) * frameSize;

  let offset = 0;
  while (offset < audioData.length) {
    const remainingData = audioData.length - offset;
    const chunkDataSize = Math.min(alignedMaxDataPerChunk, remainingData);

    // Ensure last chunk is also aligned (if not the remainder)
    const alignedChunkDataSize =
      chunkDataSize === remainingData
        ? Math.floor(chunkDataSize / frameSize) * frameSize
        : chunkDataSize;

    // Skip if no data left after alignment
    if (alignedChunkDataSize <= 0) {
      break;
    }

    const chunkData = audioData.slice(offset, offset + alignedChunkDataSize);
    const chunkHeader = createWavHeader(metadata, alignedChunkDataSize);
    const chunk = Buffer.concat([chunkHeader, chunkData]);

    chunks.push(chunk);
    offset += alignedChunkDataSize;
  }

  return chunks;
}

/**
 * Merge multiple transcription results into one
 */
export function mergeTranscriptions(transcriptions: string[]): string {
  return transcriptions
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .join(' ');
}
