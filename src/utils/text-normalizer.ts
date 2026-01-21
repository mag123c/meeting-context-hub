/**
 * Korean text normalizer for filename generation
 */

import { STORAGE_CONFIG } from "../config/constants.js";

/**
 * Normalize Korean text for use in filenames
 * - Removes common Korean particles and endings
 * - Removes invalid filename characters
 * - Converts spaces to hyphens
 * - Truncates to max length without cutting mid-word
 */
export function normalizeKoreanText(text: string, maxLength?: number): string {
  const limit = maxLength ?? STORAGE_CONFIG.MAX_TITLE_LENGTH;

  // Remove unnecessary particles/endings and extract core
  const cleaned = text
    .replace(/했습니다|합니다|입니다|됩니다|있습니다/g, "")
    .replace(/[을를이가은는의에서로](?=\s|$)/g, "")
    .replace(/[<>:"/\\|?*.,!?]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // Max char limit, don't cut mid-word
  if (cleaned.length <= limit) return cleaned;

  const truncated = cleaned.slice(0, limit);
  const lastDash = truncated.lastIndexOf("-");
  return lastDash > 5 ? truncated.slice(0, lastDash) : truncated;
}
