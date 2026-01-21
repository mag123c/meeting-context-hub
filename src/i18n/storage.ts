import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { SupportedLanguage } from "./types.js";
import { DEFAULT_LANGUAGE } from "./locales/index.js";

const CONFIG_DIR = join(homedir(), ".config", "mch");
const PREFERENCES_FILE = join(CONFIG_DIR, "preferences.json");

interface Preferences {
  language?: SupportedLanguage;
}

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function readPreferences(): Preferences {
  try {
    if (existsSync(PREFERENCES_FILE)) {
      const content = readFileSync(PREFERENCES_FILE, "utf-8");
      return JSON.parse(content) as Preferences;
    }
  } catch {
    // Ignore read errors, return empty preferences
  }
  return {};
}

function writePreferences(prefs: Preferences): void {
  ensureConfigDir();
  writeFileSync(PREFERENCES_FILE, JSON.stringify(prefs, null, 2), "utf-8");
}

/**
 * Get the current language preference.
 * Priority: MCH_LANGUAGE env var > stored preference > default
 */
export function getStoredLanguage(): SupportedLanguage {
  // Check environment variable first
  const envLang = process.env.MCH_LANGUAGE;
  if (envLang === "en" || envLang === "ko") {
    return envLang;
  }

  // Check stored preference
  const prefs = readPreferences();
  if (prefs.language && (prefs.language === "en" || prefs.language === "ko")) {
    return prefs.language;
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Save language preference to disk.
 */
export function setStoredLanguage(language: SupportedLanguage): void {
  const prefs = readPreferences();
  prefs.language = language;
  writePreferences(prefs);
}

/**
 * Check if language was set via environment variable.
 */
export function isLanguageFromEnv(): boolean {
  const envLang = process.env.MCH_LANGUAGE;
  return envLang === "en" || envLang === "ko";
}
