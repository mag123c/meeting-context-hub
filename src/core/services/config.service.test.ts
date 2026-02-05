import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigService } from './config.service.js';

// Mock the config adapter
vi.mock('../../adapters/config/index.js', () => ({
  loadConfig: vi.fn(),
  getConfigStatus: vi.fn(),
  validateApiKeyFormat: vi.fn(),
  setApiKeyInFile: vi.fn(),
  saveFileConfig: vi.fn(),
}));

import {
  getConfigStatus,
  saveFileConfig,
} from '../../adapters/config/index.js';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(() => {
    service = new ConfigService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('setConfigValue', () => {
    describe('language', () => {
      it('should change language from ko to en', async () => {
        vi.mocked(saveFileConfig).mockImplementation(() => {});
        vi.mocked(getConfigStatus).mockReturnValue({
          anthropicKey: { set: true, source: 'env', masked: 'sk-ant-***' },
          openaiKey: { set: false, source: 'none', masked: 'Not set' },
          dbPath: '/path/to/db',
          language: 'en',
        });

        const result = await service.setConfigValue('language', 'en');

        expect(result.success).toBe(true);
        expect(saveFileConfig).toHaveBeenCalledWith({ language: 'en' });
      });

      it('should change language from en to ko', async () => {
        vi.mocked(saveFileConfig).mockImplementation(() => {});
        vi.mocked(getConfigStatus).mockReturnValue({
          anthropicKey: { set: true, source: 'env', masked: 'sk-ant-***' },
          openaiKey: { set: false, source: 'none', masked: 'Not set' },
          dbPath: '/path/to/db',
          language: 'ko',
        });

        const result = await service.setConfigValue('language', 'ko');

        expect(result.success).toBe(true);
        expect(saveFileConfig).toHaveBeenCalledWith({ language: 'ko' });
      });

      it('should reject invalid language value', async () => {
        // @ts-expect-error - Testing invalid input
        const result = await service.setConfigValue('language', 'fr');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid language');
        expect(saveFileConfig).not.toHaveBeenCalled();
      });

      it('should reflect change in getConfigStatus', async () => {
        vi.mocked(saveFileConfig).mockImplementation(() => {});
        vi.mocked(getConfigStatus).mockReturnValue({
          anthropicKey: { set: true, source: 'env', masked: 'sk-ant-***' },
          openaiKey: { set: false, source: 'none', masked: 'Not set' },
          dbPath: '/path/to/db',
          language: 'en',
        });

        await service.setConfigValue('language', 'en');
        const status = service.getConfigStatus();

        expect(status.language).toBe('en');
      });
    });

    describe('dbPath', () => {
      it('should change dbPath', async () => {
        vi.mocked(saveFileConfig).mockImplementation(() => {});
        vi.mocked(getConfigStatus).mockReturnValue({
          anthropicKey: { set: true, source: 'env', masked: 'sk-ant-***' },
          openaiKey: { set: false, source: 'none', masked: 'Not set' },
          dbPath: '/new/path/to/db.sqlite',
          language: 'ko',
        });

        const result = await service.setConfigValue('dbPath', '/new/path/to/db.sqlite');

        expect(result.success).toBe(true);
        expect(saveFileConfig).toHaveBeenCalledWith({ dbPath: '/new/path/to/db.sqlite' });
      });

      it('should reject empty dbPath', async () => {
        const result = await service.setConfigValue('dbPath', '');

        expect(result.success).toBe(false);
        expect(result.error).toContain('empty');
        expect(saveFileConfig).not.toHaveBeenCalled();
      });

      it('should handle file system errors gracefully', async () => {
        vi.mocked(saveFileConfig).mockImplementation(() => {
          throw new Error('Permission denied');
        });

        const result = await service.setConfigValue('dbPath', '/invalid/path');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Permission denied');
      });
    });
  });
});
