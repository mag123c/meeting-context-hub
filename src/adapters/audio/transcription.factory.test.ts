import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TranscriptionFactory,
  createTranscriptionProvider,
} from './transcription.factory.js';
import { TranscriptionError } from '../../types/errors.js';

// Mock whisper-node
vi.mock('whisper-node', () => ({
  default: vi.fn(),
}));

// Mock OpenAI
vi.mock('openai', () => ({
  default: class MockOpenAI {
    audio = {
      transcriptions: {
        create: vi.fn().mockResolvedValue({ text: 'test' }),
      },
    };
  },
}));

// Mock fs for model check
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    existsSync: vi.fn((path: string) => {
      // Model exists for testing
      if (path.includes('ggml-base.bin')) {
        return true;
      }
      return actual.existsSync(path);
    }),
    mkdirSync: vi.fn(),
  };
});

describe('TranscriptionFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    it('should create local adapter for local mode', () => {
      const provider = TranscriptionFactory.create({
        config: { mode: 'local' },
      });

      expect(provider).toBeDefined();
      expect(provider.transcribeFile).toBeDefined();
      expect(provider.transcribeBuffer).toBeDefined();
    });

    it('should create API adapter for api mode', () => {
      const provider = TranscriptionFactory.create({
        openaiApiKey: 'sk-test-key',
        config: { mode: 'api' },
      });

      expect(provider).toBeDefined();
    });

    it('should throw error for api mode without API key', () => {
      expect(() =>
        TranscriptionFactory.create({
          config: { mode: 'api' },
        })
      ).toThrow(TranscriptionError);
    });

    it('should create auto adapter for auto mode', () => {
      const provider = TranscriptionFactory.create({
        openaiApiKey: 'sk-test-key',
        config: { mode: 'auto' },
      });

      expect(provider).toBeDefined();
    });

    it('should create auto adapter without API key (local only)', () => {
      const provider = TranscriptionFactory.create({
        config: { mode: 'auto' },
      });

      expect(provider).toBeDefined();
    });

    it('should use default config when not provided', () => {
      const provider = TranscriptionFactory.create({
        openaiApiKey: 'sk-test-key',
      });

      expect(provider).toBeDefined();
    });

    it('should pass vocabulary to adapters', () => {
      const provider = TranscriptionFactory.create({
        openaiApiKey: 'sk-test-key',
        config: {
          mode: 'api',
          vocabulary: ['Supabase', 'Claude'],
        },
      });

      expect(provider).toBeDefined();
    });
  });

  describe('isLocalAvailable', () => {
    it('should check if local model is available', () => {
      const available = TranscriptionFactory.isLocalAvailable('base');
      expect(typeof available).toBe('boolean');
    });
  });

  describe('createTranscriptionProvider helper', () => {
    it('should create provider using helper function', () => {
      const provider = createTranscriptionProvider({
        openaiApiKey: 'sk-test-key',
        config: { mode: 'api' },
      });

      expect(provider).toBeDefined();
    });
  });
});
