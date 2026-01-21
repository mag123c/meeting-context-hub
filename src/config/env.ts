import { resolve } from "path";
import { homedir } from "os";

export function getEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] ?? defaultValue;
}

export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

export const DEFAULT_OBSIDIAN_PATH = resolve(
  homedir(),
  "Library/Mobile Documents/iCloud~md~obsidian/Documents"
);

export const DEFAULT_MCH_FOLDER = "mch";
