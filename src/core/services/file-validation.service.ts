import * as fs from 'fs';
import * as path from 'path';

export interface ValidationResult {
  valid: boolean;
  errorCode?: 'FILE_NOT_FOUND' | 'INVALID_FILE_EXTENSION';
  error?: string;
}

/**
 * Supported audio extensions (Whisper API compatible)
 * https://platform.openai.com/docs/guides/speech-to-text
 */
const SUPPORTED_EXTENSIONS = ['wav', 'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'webm'];

/**
 * Service for validating audio files
 */
export class FileValidationService {
  /**
   * Get list of supported audio extensions
   */
  getSupportedExtensions(): string[] {
    return [...SUPPORTED_EXTENSIONS];
  }

  /**
   * Validate an audio file path
   */
  validateAudioFile(filePath: string): ValidationResult {
    // Check empty path
    if (!filePath) {
      return {
        valid: false,
        errorCode: 'FILE_NOT_FOUND',
        error: 'File path is empty',
      };
    }

    // Check file exists
    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        errorCode: 'FILE_NOT_FOUND',
        error: 'File does not exist',
      };
    }

    // Check extension
    const ext = path.extname(filePath).toLowerCase().slice(1); // Remove leading dot
    if (!ext || !SUPPORTED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        errorCode: 'INVALID_FILE_EXTENSION',
        error: `Unsupported file extension: ${ext || '(none)'}`,
      };
    }

    return { valid: true };
  }

  /**
   * Format supported extensions for display
   */
  formatSupportedExtensions(): string {
    return SUPPORTED_EXTENSIONS.join(', ');
  }
}
