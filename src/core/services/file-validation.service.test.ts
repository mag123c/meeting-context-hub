import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileValidationService } from './file-validation.service.js';
import * as fs from 'fs';

vi.mock('fs');

describe('FileValidationService', () => {
  let service: FileValidationService;

  beforeEach(() => {
    service = new FileValidationService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getSupportedExtensions', () => {
    it('should return supported audio extensions', () => {
      const extensions = service.getSupportedExtensions();
      expect(extensions).toContain('wav');
      expect(extensions).toContain('mp3');
      expect(extensions).toContain('mp4');
      expect(extensions).toContain('mpeg');
      expect(extensions).toContain('mpga');
      expect(extensions).toContain('m4a');
      expect(extensions).toContain('webm');
    });
  });

  describe('validateAudioFile', () => {
    it('should return valid for existing file with supported extension', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = service.validateAudioFile('/path/to/audio.mp3');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for non-existent file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = service.validateAudioFile('/path/to/nonexistent.mp3');

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('FILE_NOT_FOUND');
    });

    it('should return invalid for unsupported extension', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = service.validateAudioFile('/path/to/document.txt');

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_EXTENSION');
    });

    it('should handle various supported extensions', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const extensions = ['wav', 'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'webm'];
      for (const ext of extensions) {
        const result = service.validateAudioFile(`/path/to/audio.${ext}`);
        expect(result.valid).toBe(true);
      }
    });

    it('should be case-insensitive for extensions', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result1 = service.validateAudioFile('/path/to/audio.MP3');
      const result2 = service.validateAudioFile('/path/to/audio.WaV');

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });

    it('should handle empty path', () => {
      const result = service.validateAudioFile('');

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('FILE_NOT_FOUND');
    });

    it('should handle files without extension', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = service.validateAudioFile('/path/to/audiofile');

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_EXTENSION');
    });
  });

  describe('formatSupportedExtensions', () => {
    it('should format extensions as comma-separated string', () => {
      const formatted = service.formatSupportedExtensions();
      expect(formatted).toContain('wav');
      expect(formatted).toContain('mp3');
      expect(formatted).toMatch(/wav.*mp3/); // Contains both in some order
    });
  });
});
