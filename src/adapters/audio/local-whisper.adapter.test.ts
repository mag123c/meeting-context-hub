import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LocalWhisperAdapter } from './local-whisper.adapter.js';
import { ModelManager } from './model-manager.service.js';
import { TranscriptionError } from '../../types/errors.js';

// Mock whisper-node
vi.mock('whisper-node', () => ({
  default: vi.fn(),
}));

// Mock fs
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn((path: string) => {
      // Model exists for testing
      if (path.includes('ggml-base.bin')) {
        return true;
      }
      // Test audio file exists
      if (path.includes('test.wav')) {
        return true;
      }
      return false;
    }),
    readFileSync: vi.fn(() => createTestWavBuffer()),
    writeFileSync: vi.fn(),
    unlinkSync: vi.fn(),
    mkdirSync: vi.fn(),
  };
});

/**
 * Create a minimal valid WAV buffer for testing
 */
function createTestWavBuffer(): Buffer {
  const header = Buffer.alloc(44);
  const dataSize = 1000;

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(16000, 24);
  header.writeUInt32LE(32000, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, Buffer.alloc(dataSize)]);
}

describe('LocalWhisperAdapter', () => {
  let adapter: LocalWhisperAdapter;
  let mockModelManager: ModelManager;

  beforeEach(() => {
    vi.clearAllMocks();

    mockModelManager = {
      isModelDownloaded: vi.fn().mockReturnValue(true),
      getModelPath: vi.fn().mockReturnValue('/path/to/ggml-base.bin'),
      downloadModel: vi.fn().mockResolvedValue('/path/to/ggml-base.bin'),
      ensureModelsDir: vi.fn(),
    } as unknown as ModelManager;

    adapter = new LocalWhisperAdapter({
      model: 'base',
      modelManager: mockModelManager,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create adapter with default config', () => {
      const defaultAdapter = new LocalWhisperAdapter();
      expect(defaultAdapter).toBeDefined();
    });

    it('should create adapter with custom model', () => {
      const customAdapter = new LocalWhisperAdapter({ model: 'small' });
      expect(customAdapter).toBeDefined();
    });
  });

  describe('isModelReady', () => {
    it('should return true when model is downloaded', () => {
      expect(adapter.isModelReady()).toBe(true);
    });

    it('should return false when model is not downloaded', () => {
      mockModelManager.isModelDownloaded = vi.fn().mockReturnValue(false);
      const newAdapter = new LocalWhisperAdapter({
        model: 'base',
        modelManager: mockModelManager,
      });
      expect(newAdapter.isModelReady()).toBe(false);
    });
  });

  describe('ensureModel', () => {
    it('should not download if model already exists', async () => {
      await adapter.ensureModel();
      expect(mockModelManager.downloadModel).not.toHaveBeenCalled();
    });

    it('should download model if not exists', async () => {
      mockModelManager.isModelDownloaded = vi.fn().mockReturnValue(false);
      const newAdapter = new LocalWhisperAdapter({
        model: 'base',
        modelManager: mockModelManager,
      });

      await newAdapter.ensureModel();
      expect(mockModelManager.downloadModel).toHaveBeenCalledWith('base', undefined);
    });
  });

  describe('transcribeFile', () => {
    it('should throw error when file not found', async () => {
      const fs = await import('fs');
      (fs.existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);

      await expect(adapter.transcribeFile('/nonexistent.wav')).rejects.toThrow(
        TranscriptionError
      );
    });

    it('should throw error when model not ready', async () => {
      mockModelManager.isModelDownloaded = vi.fn().mockReturnValue(false);
      const newAdapter = new LocalWhisperAdapter({
        model: 'base',
        modelManager: mockModelManager,
        autoDownload: false,
      });

      await expect(newAdapter.transcribeFile('/test.wav')).rejects.toThrow(
        TranscriptionError
      );
    });
  });

  describe('transcribeBuffer', () => {
    it('should throw error when model not ready', async () => {
      mockModelManager.isModelDownloaded = vi.fn().mockReturnValue(false);
      const newAdapter = new LocalWhisperAdapter({
        model: 'base',
        modelManager: mockModelManager,
        autoDownload: false,
      });

      const buffer = createTestWavBuffer();
      await expect(newAdapter.transcribeBuffer(buffer)).rejects.toThrow(
        TranscriptionError
      );
    });
  });
});

describe('ModelManager', () => {
  it('should get correct model path', () => {
    const manager = new ModelManager('/tmp/models');
    const path = manager.getModelPath('base');
    expect(path).toContain('ggml-base.bin');
  });

  it('should list all models', () => {
    const manager = new ModelManager('/tmp/models');
    const models = manager.listModels();

    expect(models).toHaveLength(5);
    expect(models.map((m) => m.model)).toEqual([
      'tiny',
      'base',
      'small',
      'medium',
      'large',
    ]);
  });
});
