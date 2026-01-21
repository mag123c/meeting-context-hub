/**
 * macOS Keychain integration for secure API key storage
 * CLI-only module - no web exposure
 */

import { spawnSync } from "child_process";

const SERVICE_NAME = "mch";

/**
 * Validate account name to prevent injection
 * Only allows uppercase letters and underscores (e.g., ANTHROPIC_API_KEY)
 */
function validateAccountName(account: string): void {
  if (!/^[A-Z_]+$/.test(account)) {
    throw new Error("Invalid account name: must contain only uppercase letters and underscores");
  }
}

export function getApiKeyFromKeychain(account: string): string | null {
  validateAccountName(account);

  const result = spawnSync("security", [
    "find-generic-password",
    "-s", SERVICE_NAME,
    "-a", account,
    "-w"
  ], { encoding: "utf-8" });

  if (result.status !== 0 || result.error) {
    return null;
  }

  return result.stdout.trim();
}

export function setApiKeyInKeychain(account: string, value: string): void {
  validateAccountName(account);

  // Delete existing (ignore errors if not found)
  spawnSync("security", [
    "delete-generic-password",
    "-s", SERVICE_NAME,
    "-a", account
  ], { encoding: "utf-8" });

  // Add new key
  const result = spawnSync("security", [
    "add-generic-password",
    "-s", SERVICE_NAME,
    "-a", account,
    "-w", value
  ], { encoding: "utf-8" });

  if (result.status !== 0) {
    throw new Error(`Failed to save API key to keychain: ${result.stderr || "Unknown error"}`);
  }
}

export function deleteApiKeyFromKeychain(account: string): void {
  validateAccountName(account);

  spawnSync("security", [
    "delete-generic-password",
    "-s", SERVICE_NAME,
    "-a", account
  ], { encoding: "utf-8" });
  // Ignore result - key may not exist
}
