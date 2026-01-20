/**
 * macOS Keychain integration for secure API key storage
 * CLI-only module - no web exposure
 */

import { execSync } from "child_process";

const SERVICE_NAME = "mch";

export function getApiKeyFromKeychain(account: string): string | null {
  try {
    const result = execSync(
      `security find-generic-password -s "${SERVICE_NAME}" -a "${account}" -w`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    );
    return result.trim();
  } catch {
    return null;
  }
}

export function setApiKeyInKeychain(account: string, value: string): void {
  try {
    execSync(
      `security delete-generic-password -s "${SERVICE_NAME}" -a "${account}" 2>/dev/null || true`,
      { encoding: "utf-8" }
    );
    execSync(
      `security add-generic-password -s "${SERVICE_NAME}" -a "${account}" -w "${value}"`,
      { encoding: "utf-8" }
    );
  } catch (error) {
    throw new Error(`Failed to save API key to keychain: ${error}`);
  }
}

export function deleteApiKeyFromKeychain(account: string): void {
  try {
    execSync(
      `security delete-generic-password -s "${SERVICE_NAME}" -a "${account}"`,
      { encoding: "utf-8" }
    );
  } catch {
    // Ignore if key doesn't exist
  }
}
