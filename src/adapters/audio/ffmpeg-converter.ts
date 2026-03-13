/**
 * FFmpeg Audio Converter
 *
 * Converts non-WAV audio files to PCM WAV for splitting.
 * Follows the same external binary pattern as sox (recording.adapter.ts).
 */

import { execFileSync, execFile as execFileCb } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { TranscriptionError, ErrorCode } from '../../types/errors.js';

/**
 * Check if ffmpeg is available on the system
 */
export function checkFfmpeg(): boolean {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert an audio file to PCM 16-bit WAV (16kHz mono)
 * Optimized for Whisper API input.
 *
 * @returns Path to the converted WAV file (caller must clean up)
 */
export async function convertToWav(inputPath: string): Promise<string> {
  if (!checkFfmpeg()) {
    throw new TranscriptionError(
      'ffmpeg이 설치되어 있지 않습니다. 대용량 비-WAV 파일 변환에 ffmpeg이 필요합니다.',
      ErrorCode.TRANSCRIPTION_FFMPEG_NOT_FOUND,
      false,
    );
  }

  const outputPath = join(tmpdir(), `mch-ffmpeg-${randomUUID()}.wav`);

  const args = [
    '-i', inputPath,
    '-ar', '16000',
    '-ac', '1',
    '-acodec', 'pcm_s16le',
    '-f', 'wav',
    '-y',             // overwrite output
    outputPath,
  ];

  return new Promise((resolve, reject) => {
    execFileCb('ffmpeg', args, { timeout: 300_000 }, (error, _stdout, _stderr) => {
      if (error) {
        // Clean up partial output
        if (existsSync(outputPath)) {
          try { unlinkSync(outputPath); } catch { /* ignore */ }
        }
        reject(new TranscriptionError(
          `ffmpeg 변환 실패: ${error.message}`,
          ErrorCode.TRANSCRIPTION_FAILED,
          true,
          error,
        ));
        return;
      }

      if (!existsSync(outputPath)) {
        reject(new TranscriptionError(
          'ffmpeg 변환 완료되었으나 출력 파일이 없습니다.',
          ErrorCode.TRANSCRIPTION_FAILED,
          false,
        ));
        return;
      }

      resolve(outputPath);
    });
  });
}
