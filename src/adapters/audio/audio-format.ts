/**
 * Audio Format Detection
 *
 * Detects audio format from buffer magic bytes.
 * Used to determine whether ffmpeg conversion is needed before WAV splitting.
 */

export type AudioFormat = 'wav' | 'mp3' | 'm4a' | 'ogg' | 'flac' | 'webm' | 'unknown';

/**
 * Detect audio format from buffer header (magic bytes)
 */
export function detectAudioFormat(buffer: Buffer): AudioFormat {
  if (buffer.length < 4) return 'unknown';

  // WAV: RIFF....WAVE
  if (
    buffer.length >= 12 &&
    buffer.slice(0, 4).toString() === 'RIFF' &&
    buffer.slice(8, 12).toString() === 'WAVE'
  ) {
    return 'wav';
  }

  // OGG: OggS
  if (buffer.slice(0, 4).toString() === 'OggS') {
    return 'ogg';
  }

  // FLAC: fLaC
  if (buffer.slice(0, 4).toString() === 'fLaC') {
    return 'flac';
  }

  // MP3: ID3 tag
  if (buffer.slice(0, 3).toString() === 'ID3') {
    return 'mp3';
  }

  // MP3: sync word (0xFF followed by 0xE0+ masked)
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return 'mp3';
  }

  // M4A/MP4: ftyp at offset 4
  if (buffer.length >= 8 && buffer.slice(4, 8).toString() === 'ftyp') {
    return 'm4a';
  }

  // WebM/MKV: EBML header 0x1A45DFA3
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return 'webm';
  }

  return 'unknown';
}

/**
 * Check if buffer is WAV format
 */
export function isWavFormat(buffer: Buffer): boolean {
  return detectAudioFormat(buffer) === 'wav';
}

/**
 * Get MIME type for audio format
 */
export function getMimeType(format: AudioFormat): string {
  const mimeTypes: Record<AudioFormat, string> = {
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    webm: 'audio/webm',
    unknown: 'application/octet-stream',
  };
  return mimeTypes[format];
}

/**
 * Get file extension for audio format
 */
export function getExtension(format: AudioFormat): string {
  const extensions: Record<AudioFormat, string> = {
    wav: '.wav',
    mp3: '.mp3',
    m4a: '.m4a',
    ogg: '.ogg',
    flac: '.flac',
    webm: '.webm',
    unknown: '.bin',
  };
  return extensions[format];
}
