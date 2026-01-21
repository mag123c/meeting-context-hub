import type { SupportedLanguage, Translations } from "../types.js";
import { en } from "./en.js";
import { ko } from "./ko.js";

export const locales: Record<SupportedLanguage, Translations> = {
  en,
  ko,
};

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

export function getTranslations(language: SupportedLanguage): Translations {
  return locales[language] ?? locales[DEFAULT_LANGUAGE];
}

export { en, ko };
