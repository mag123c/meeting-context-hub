/**
 * i18n module for Meeting Context Hub
 * Provides translation helper function t()
 */

import { UI_STRINGS, type StringKey, type Language } from './strings.js';

/**
 * Get translated string for the given key and language
 * @param key - The string key from UI_STRINGS
 * @param lang - The target language ('ko' or 'en')
 * @returns The translated string
 */
export function t(key: StringKey, lang: Language = 'ko'): string {
  const entry = UI_STRINGS[key];
  if (!entry) {
    console.warn(`[i18n] Missing string key: ${key}`);
    return key;
  }
  return entry[lang];
}

/**
 * Get translated string with interpolation
 * @param key - The string key from UI_STRINGS
 * @param lang - The target language ('ko' or 'en')
 * @param params - Key-value pairs to interpolate
 * @returns The translated string with values interpolated
 *
 * @example
 * ```ts
 * // strings.ts: 'list.subtitle': { ko: '총 {total}개 | 페이지 {page}/{totalPages}', en: '...' }
 * ti('list.subtitle', 'ko', { total: 10, page: 1, totalPages: 2 })
 * // Returns: '총 10개 | 페이지 1/2'
 * ```
 */
export function ti(
  key: StringKey,
  lang: Language,
  params: Record<string, string | number>
): string {
  let result = t(key, lang);

  for (const [paramKey, paramValue] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
  }

  return result;
}

// Re-export types
export { UI_STRINGS, type StringKey, type Language };
