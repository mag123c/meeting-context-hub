import { createReadStream, createWriteStream, existsSync, mkdirSync, statSync, openSync, writeSync, closeSync } from "fs";
import { dirname } from "path";

/**
 * Update WAV header to reflect actual file size after merging.
 * WAV headers contain size information that must be updated after concatenation.
 */
function updateWavHeader(filePath: string): void {
  const stats = statSync(filePath);
  const dataSize = stats.size - 44;

  const fd = openSync(filePath, "r+");
  const buffer = Buffer.alloc(4);

  try {
    // Update RIFF chunk size (offset 4): total file size - 8
    buffer.writeUInt32LE(stats.size - 8, 0);
    writeSync(fd, buffer, 0, 4, 4);

    // Update data chunk size (offset 40): data size
    buffer.writeUInt32LE(dataSize, 0);
    writeSync(fd, buffer, 0, 4, 40);
  } finally {
    closeSync(fd);
  }
}

/**
 * Merge multiple WAV files into a single file.
 * Uses simple concatenation - works for WAV files with same encoding.
 *
 * Note: This is a simplified implementation that concatenates raw audio data.
 * For production use with varied WAV formats, consider using ffmpeg via fluent-ffmpeg.
 */
export async function mergeWavFiles(inputPaths: string[], outputPath: string): Promise<void> {
  // Ensure output directory exists
  const outputDir = dirname(outputPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Filter out empty or non-existent files
  const validPaths = inputPaths.filter(p => {
    try {
      const stats = statSync(p);
      return stats.size > 44; // WAV header is 44 bytes
    } catch {
      return false;
    }
  });

  if (validPaths.length === 0) {
    throw new Error("No valid audio files to merge");
  }

  // If only one file, just copy it
  if (validPaths.length === 1) {
    await copyFile(validPaths[0], outputPath);
    return;
  }

  // For multiple files, concatenate them
  // WAV files from mic package have consistent format (16kHz, 16bit, mono)
  // We can concatenate the raw PCM data after the first file's header

  const outputStream = createWriteStream(outputPath);

  return new Promise((resolve, reject) => {
    let isFirstFile = true;
    let currentIndex = 0;

    const processNextFile = () => {
      if (currentIndex >= validPaths.length) {
        outputStream.end(() => {
          // Update WAV header with correct sizes after all data is written
          updateWavHeader(outputPath);
          resolve();
        });
        return;
      }

      const inputPath = validPaths[currentIndex];
      const inputStream = createReadStream(inputPath);
      let bytesSkipped = 0;
      const headerSize = isFirstFile ? 0 : 44; // Skip header for subsequent files

      inputStream.on("data", (chunk: Buffer) => {
        if (!isFirstFile && bytesSkipped < headerSize) {
          const skipBytes = Math.min(headerSize - bytesSkipped, chunk.length);
          bytesSkipped += skipBytes;
          if (chunk.length > skipBytes) {
            outputStream.write(chunk.slice(skipBytes));
          }
        } else {
          outputStream.write(chunk);
        }
      });

      inputStream.on("end", () => {
        isFirstFile = false;
        currentIndex++;
        processNextFile();
      });

      inputStream.on("error", reject);
    };

    outputStream.on("error", reject);
    processNextFile();
  });
}

async function copyFile(src: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const readStream = createReadStream(src);
    const writeStream = createWriteStream(dest);

    readStream.on("error", reject);
    writeStream.on("error", reject);
    writeStream.on("finish", resolve);

    readStream.pipe(writeStream);
  });
}
