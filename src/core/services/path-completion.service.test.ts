import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PathCompletionService } from './path-completion.service.js';
import * as fs from 'fs';
import * as os from 'os';

vi.mock('fs');
vi.mock('os');

describe('PathCompletionService', () => {
  let service: PathCompletionService;

  beforeEach(() => {
    service = new PathCompletionService();
    vi.mocked(os.homedir).mockReturnValue('/Users/test');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('expandPath', () => {
    it('should expand ~ to home directory', () => {
      expect(service.expandPath('~/Documents')).toBe('/Users/test/Documents');
    });

    it('should expand ~ at start only', () => {
      expect(service.expandPath('~/foo/~/bar')).toBe('/Users/test/foo/~/bar');
    });

    it('should return path unchanged if no ~', () => {
      expect(service.expandPath('/usr/local')).toBe('/usr/local');
    });

    it('should handle ~ alone', () => {
      expect(service.expandPath('~')).toBe('/Users/test');
    });

    it('should handle empty string', () => {
      expect(service.expandPath('')).toBe('');
    });
  });

  describe('getCompletions', () => {
    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'meeting.mp3', isDirectory: () => false },
        { name: 'meeting2.wav', isDirectory: () => false },
        { name: 'Documents', isDirectory: () => true },
        { name: 'Downloads', isDirectory: () => true },
      ] as unknown as fs.Dirent[]);
    });

    it('should return completions matching partial filename', () => {
      const completions = service.getCompletions('/Users/test/meet');
      expect(completions).toContain('/Users/test/meeting.mp3');
      expect(completions).toContain('/Users/test/meeting2.wav');
    });

    it('should expand ~ before completing', () => {
      const completions = service.getCompletions('~/meet');
      expect(completions).toContain('/Users/test/meeting.mp3');
      expect(completions).toContain('/Users/test/meeting2.wav');
    });

    it('should append / to directories', () => {
      const completions = service.getCompletions('/Users/test/Doc');
      expect(completions).toContain('/Users/test/Documents/');
    });

    it('should return empty array if directory does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const completions = service.getCompletions('/nonexistent/path');
      expect(completions).toEqual([]);
    });

    it('should return all entries when partial is just the directory', () => {
      vi.mocked(fs.existsSync).mockImplementation((p) => {
        return p === '/Users/test/';
      });
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as fs.Stats);
      const completions = service.getCompletions('/Users/test/');
      expect(completions.length).toBe(4);
    });

    it('should handle errors gracefully', () => {
      vi.mocked(fs.readdirSync).mockImplementation(() => {
        throw new Error('Permission denied');
      });
      const completions = service.getCompletions('/private');
      expect(completions).toEqual([]);
    });
  });

  describe('findCommonPrefix', () => {
    it('should find common prefix of paths', () => {
      const paths = [
        '/Users/test/meeting_001.mp3',
        '/Users/test/meeting_002.mp3',
        '/Users/test/meeting_003.mp3',
      ];
      expect(service.findCommonPrefix(paths)).toBe('/Users/test/meeting_00');
    });

    it('should return empty string for empty array', () => {
      expect(service.findCommonPrefix([])).toBe('');
    });

    it('should return the path itself for single element', () => {
      expect(service.findCommonPrefix(['/Users/test/file.mp3'])).toBe('/Users/test/file.mp3');
    });

    it('should return empty string when no common prefix', () => {
      const paths = ['/Users/a.mp3', '/home/b.mp3'];
      expect(service.findCommonPrefix(paths)).toBe('/');
    });

    it('should handle paths with different lengths', () => {
      const paths = ['/Users/test/a.mp3', '/Users/test/abc.mp3'];
      expect(service.findCommonPrefix(paths)).toBe('/Users/test/a');
    });
  });
});
