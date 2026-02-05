import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TranscriptionError, ErrorCode } from '../../types/errors.js';
import * as fs from 'fs';

// Mock OpenAI
const mockCreate = vi.fn();
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      audio = {
        transcriptions: {
          create: mockCreate,
        },
      };
    },
  };
});

// Mock fs
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof fs>();
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    statSync: vi.fn(),
    createReadStream: vi.fn(),
  };
});

// Import after mocks
import { WhisperAdapter, OpenAIWhisperAdapter } from './openai-whisper.adapter.js';

describe('WhisperAdapter', () => {
  let adapter: WhisperAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockReset();
    adapter = new WhisperAdapter('test-api-key');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('transcribeFile', () => {
    it('should throw error if file not found', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await expect(adapter.transcribeFile('/path/to/missing.wav')).rejects.toThrow(
        TranscriptionError
      );
      await expect(adapter.transcribeFile('/path/to/missing.wav')).rejects.toMatchObject({
        code: ErrorCode.TRANSCRIPTION_FILE_NOT_FOUND,
      });
    });

    it('should transcribe small file without splitting', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 10 * 1024 * 1024 } as fs.Stats);
      vi.mocked(fs.createReadStream).mockReturnValue('mock-stream' as unknown as fs.ReadStream);
      mockCreate.mockResolvedValue({ text: 'Hello world' });

      const result = await adapter.transcribeFile('/path/to/audio.wav');

      expect(result).toBe('Hello world');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should split large file and merge transcriptions', async () => {
      // Mock large file (25MB)
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 25 * 1024 * 1024 } as fs.Stats);

      // Create a mock large WAV buffer
      const mockLargeBuffer = createMockWavBuffer(25 * 1024 * 1024);
      vi.mocked(fs.readFileSync).mockReturnValue(mockLargeBuffer);

      // Mock OpenAI responses for each chunk
      mockCreate
        .mockResolvedValueOnce({ text: 'First part' })
        .mockResolvedValueOnce({ text: 'Second part' });

      const result = await adapter.transcribeFile('/path/to/large.wav');

      expect(result).toBe('First part Second part');
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should auto-split large file based on size check (proactive split)', async () => {
      // When file is > 20MB, it should proactively split without hitting API first
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 24 * 1024 * 1024 } as fs.Stats);

      // Mock buffer for split
      const mockBuffer = createMockWavBuffer(24 * 1024 * 1024);
      vi.mocked(fs.readFileSync).mockReturnValue(mockBuffer);

      // Split creates 2 chunks, each succeeds
      mockCreate
        .mockResolvedValueOnce({ text: 'Part 1' })
        .mockResolvedValueOnce({ text: 'Part 2' });

      const result = await adapter.transcribeFile('/path/to/audio.wav');

      expect(result).toBe('Part 1 Part 2');
      // Should call create twice (one per chunk), not hit the 413 path
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should throw original error if not 413', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 10 * 1024 * 1024 } as fs.Stats);
      vi.mocked(fs.createReadStream).mockReturnValue('mock-stream' as unknown as fs.ReadStream);

      const otherError = new Error('Network error');
      mockCreate.mockRejectedValue(otherError);

      await expect(adapter.transcribeFile('/path/to/audio.wav')).rejects.toThrow(
        TranscriptionError
      );
    });
  });

  describe('transcribeBuffer', () => {
    it('should transcribe small buffer without splitting', async () => {
      const smallBuffer = createMockWavBuffer(1 * 1024 * 1024);
      mockCreate.mockResolvedValue({ text: 'Transcribed text' });

      const result = await adapter.transcribeBuffer(smallBuffer);

      expect(result).toBe('Transcribed text');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should split large buffer and merge transcriptions', async () => {
      const largeBuffer = createMockWavBuffer(25 * 1024 * 1024);
      mockCreate
        .mockResolvedValueOnce({ text: 'Chunk 1' })
        .mockResolvedValueOnce({ text: 'Chunk 2' });

      const result = await adapter.transcribeBuffer(largeBuffer);

      expect(result).toBe('Chunk 1 Chunk 2');
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should throw error on chunk failure', async () => {
      const largeBuffer = createMockWavBuffer(25 * 1024 * 1024);

      // First succeeds, second fails
      mockCreate
        .mockResolvedValueOnce({ text: 'Chunk 1' })
        .mockRejectedValueOnce(new Error('API error'));

      await expect(adapter.transcribeBuffer(largeBuffer)).rejects.toThrow(TranscriptionError);
    });
  });
});

describe('OpenAIWhisperAdapter', () => {
  describe('vocabulary support', () => {
    it('should create adapter with vocabulary', () => {
      const adapter = new OpenAIWhisperAdapter({
        apiKey: 'test-key',
        vocabulary: ['Supabase', 'Claude', 'Anthropic'],
      });

      expect(adapter.getVocabulary()).toEqual(['Supabase', 'Claude', 'Anthropic']);
    });

    it('should update vocabulary', () => {
      const adapter = new OpenAIWhisperAdapter({ apiKey: 'test-key' });
      expect(adapter.getVocabulary()).toEqual([]);

      adapter.setVocabulary(['React', 'Vue', 'Angular']);
      expect(adapter.getVocabulary()).toEqual(['React', 'Vue', 'Angular']);
    });

    it('should pass vocabulary as prompt to API', async () => {
      const adapter = new OpenAIWhisperAdapter({
        apiKey: 'test-key',
        vocabulary: ['Supabase', 'Claude'],
      });

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1 * 1024 * 1024 } as fs.Stats);
      vi.mocked(fs.createReadStream).mockReturnValue('mock-stream' as unknown as fs.ReadStream);
      mockCreate.mockResolvedValue({ text: 'Test' });

      await adapter.transcribeFile('/test.wav');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Supabase, Claude',
        })
      );
    });

    it('should not pass prompt when vocabulary is empty', async () => {
      const adapter = new OpenAIWhisperAdapter({ apiKey: 'test-key' });

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1 * 1024 * 1024 } as fs.Stats);
      vi.mocked(fs.createReadStream).mockReturnValue('mock-stream' as unknown as fs.ReadStream);
      mockCreate.mockResolvedValue({ text: 'Test' });

      await adapter.transcribeFile('/test.wav');

      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.prompt).toBeUndefined();
    });
  });

  describe('language support', () => {
    it('should use default language (ko)', async () => {
      const adapter = new OpenAIWhisperAdapter({ apiKey: 'test-key' });

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1 * 1024 * 1024 } as fs.Stats);
      vi.mocked(fs.createReadStream).mockReturnValue('mock-stream' as unknown as fs.ReadStream);
      mockCreate.mockResolvedValue({ text: 'Test' });

      await adapter.transcribeFile('/test.wav');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'ko',
        })
      );
    });

    it('should use custom language', async () => {
      const adapter = new OpenAIWhisperAdapter({
        apiKey: 'test-key',
        language: 'en',
      });

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ size: 1 * 1024 * 1024 } as fs.Stats);
      vi.mocked(fs.createReadStream).mockReturnValue('mock-stream' as unknown as fs.ReadStream);
      mockCreate.mockResolvedValue({ text: 'Test' });

      await adapter.transcribeFile('/test.wav');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'en',
        })
      );
    });
  });
});

/**
 * Helper to create a mock WAV buffer
 */
function createMockWavBuffer(totalSize: number): Buffer {
  const dataSize = totalSize - 44;
  const header = Buffer.alloc(44);

  const sampleRate = 16000;
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
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

  const data = Buffer.alloc(dataSize);
  return Buffer.concat([header, data]);
}
