/**
 * 파일 검증 유틸리티
 */

import { existsSync } from "fs";
import { resolve } from "path";

export type FileCategory = "image" | "audio" | "document";

const EXTENSIONS: Record<FileCategory, string[]> = {
  image: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  audio: [".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm"],
  document: [".txt", ".md", ".csv", ".json"],
};

export interface ValidationResult {
  valid: boolean;
  absolutePath: string;
  error?: string;
}

/**
 * 파일 존재 여부 및 확장자 검증
 */
export function validateFile(filePath: string, category: FileCategory): ValidationResult {
  const absolutePath = resolve(filePath);

  if (!existsSync(absolutePath)) {
    const typeLabel = category === "image" ? "Image" : category === "audio" ? "Audio" : "File";
    return {
      valid: false,
      absolutePath,
      error: `${typeLabel} file not found: ${absolutePath}`,
    };
  }

  const ext = "." + (absolutePath.toLowerCase().split(".").pop() || "");
  const supported = EXTENSIONS[category];

  if (!supported.includes(ext)) {
    return {
      valid: false,
      absolutePath,
      error: `Unsupported ${category} format. Supported: ${supported.join(", ")}`,
    };
  }

  return { valid: true, absolutePath };
}
