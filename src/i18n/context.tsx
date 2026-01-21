import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import type { SupportedLanguage, Translations } from "./types.js";
import { getTranslations, DEFAULT_LANGUAGE } from "./locales/index.js";
import { getStoredLanguage, setStoredLanguage } from "./storage.js";

interface I18nContextValue {
  /** Current translations object */
  t: Translations;
  /** Current language code */
  language: SupportedLanguage;
  /** Change the current language */
  setLanguage: (lang: SupportedLanguage) => void;
  /** Format a date according to current language */
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  /** Format a date with time according to current language */
  formatDateTime: (date: Date) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  children: ReactNode;
  initialLanguage?: SupportedLanguage;
}

export function I18nProvider({ children, initialLanguage }: I18nProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguage>(
    initialLanguage ?? getStoredLanguage()
  );

  const t = useMemo(() => getTranslations(language), [language]);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setStoredLanguage(lang);
    setLanguageState(lang);
  }, []);

  const formatDate = useCallback(
    (date: Date, options?: Intl.DateTimeFormatOptions) => {
      const locale = language === "ko" ? "ko-KR" : "en-US";
      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      };
      return new Date(date).toLocaleDateString(locale, options ?? defaultOptions);
    },
    [language]
  );

  const formatDateTime = useCallback(
    (date: Date) => {
      const locale = language === "ko" ? "ko-KR" : "en-US";
      return new Date(date).toLocaleString(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [language]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      t,
      language,
      setLanguage,
      formatDate,
      formatDateTime,
    }),
    [t, language, setLanguage, formatDate, formatDateTime]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback for usage outside provider
    return {
      t: getTranslations(DEFAULT_LANGUAGE),
      language: DEFAULT_LANGUAGE,
      setLanguage: () => {},
      formatDate: (date: Date) => new Date(date).toLocaleDateString(),
      formatDateTime: (date: Date) => new Date(date).toLocaleString(),
    };
  }
  return context;
}
