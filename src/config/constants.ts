/**
 * Application constants
 */

export const AI_CONFIG = {
  DEFAULT_MODEL: "claude-sonnet-4-20250514",
  MAX_TOKENS: 4096,
} as const;

export const SIMILARITY_CONFIG = {
  THRESHOLD: 0.6,
  MAX_RELATED_LINKS: 5,
} as const;

export const STORAGE_CONFIG = {
  SHORT_ID_LENGTH: 8,
  MAX_TITLE_LENGTH: 15,
} as const;
