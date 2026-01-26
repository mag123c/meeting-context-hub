import { describe, it, expect } from 'vitest';
import { t, ti, UI_STRINGS, type StringKey } from './index.js';

describe('i18n', () => {
  describe('t() function', () => {
    it('should return Korean string for ko language', () => {
      expect(t('common.back', 'ko')).toBe('돌아가기');
      expect(t('menu.add_context', 'ko')).toBe('컨텍스트 추가');
    });

    it('should return English string for en language', () => {
      expect(t('common.back', 'en')).toBe('Back');
      expect(t('menu.add_context', 'en')).toBe('Add Context');
    });

    it('should default to Korean when no language specified', () => {
      expect(t('common.back')).toBe('돌아가기');
    });

    it('should return key for missing string', () => {
      // @ts-expect-error - Testing invalid key
      expect(t('nonexistent.key', 'ko')).toBe('nonexistent.key');
    });
  });

  describe('ti() function with interpolation', () => {
    it('should interpolate single parameter', () => {
      expect(ti('project.subtitle', 'ko', { count: 5 })).toBe('5개 프로젝트');
      expect(ti('project.subtitle', 'en', { count: 5 })).toBe('5 project(s)');
    });

    it('should interpolate multiple parameters', () => {
      const result = ti('list.subtitle', 'ko', { total: 10, page: 2, totalPages: 5 });
      expect(result).toBe('총 10개 | 페이지 2/5');
    });

    it('should handle string parameters', () => {
      const result = ti('search.results_subtitle', 'en', {
        query: 'test',
        count: 3,
        method: 'semantic',
      });
      expect(result).toBe('Query: "test" | 3 results (semantic)');
    });
  });

  describe('UI_STRINGS completeness', () => {
    it('should have both ko and en for all strings', () => {
      const keys = Object.keys(UI_STRINGS) as StringKey[];

      for (const key of keys) {
        const entry = UI_STRINGS[key];
        expect(entry.ko, `Missing Korean for ${key}`).toBeDefined();
        expect(entry.en, `Missing English for ${key}`).toBeDefined();
        expect(typeof entry.ko).toBe('string');
        expect(typeof entry.en).toBe('string');
      }
    });

    it('should have required common strings', () => {
      const requiredKeys: StringKey[] = [
        'common.back',
        'common.cancel',
        'common.save',
        'common.error',
        'common.loading',
        'menu.title',
        'settings.title',
        'add.title',
        'list.title',
        'search.title',
        'detail.summary',
        'project.title',
        'record.title',
      ];

      for (const key of requiredKeys) {
        expect(UI_STRINGS[key], `Missing required key: ${key}`).toBeDefined();
      }
    });

    it('should have all menu items', () => {
      const menuKeys: StringKey[] = [
        'menu.add_context',
        'menu.record_meeting',
        'menu.search',
        'menu.list_contexts',
        'menu.projects',
        'menu.settings',
        'menu.exit',
      ];

      for (const key of menuKeys) {
        expect(UI_STRINGS[key], `Missing menu key: ${key}`).toBeDefined();
      }
    });
  });

  describe('String quality', () => {
    it('should not have empty strings', () => {
      const keys = Object.keys(UI_STRINGS) as StringKey[];

      for (const key of keys) {
        const entry = UI_STRINGS[key];
        expect(entry.ko.trim(), `Empty Korean for ${key}`).not.toBe('');
        expect(entry.en.trim(), `Empty English for ${key}`).not.toBe('');
      }
    });

    it('should have consistent interpolation placeholders', () => {
      const keys = Object.keys(UI_STRINGS) as StringKey[];

      for (const key of keys) {
        const entry = UI_STRINGS[key];
        const koPlaceholders = entry.ko.match(/\{(\w+)\}/g) || [];
        const enPlaceholders = entry.en.match(/\{(\w+)\}/g) || [];

        // Same placeholders should exist in both languages
        expect(
          koPlaceholders.sort().join(','),
          `Mismatched placeholders for ${key}`
        ).toBe(enPlaceholders.sort().join(','));
      }
    });
  });
});
