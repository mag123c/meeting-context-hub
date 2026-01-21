import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { resolve, extname } from "path";
import type { CreateMeetingInput } from "../types/meeting.types.js";
import { validateFile } from "../utils/index.js";
import { validateMeetingFile, FILE_SIZE_LIMITS } from "../utils/preflight/index.js";
import { PreflightError, ValidationError } from "../errors/index.js";

// Maximum text length for direct input (5MB equivalent)
const MAX_DIRECT_TEXT_LENGTH = FILE_SIZE_LIMITS.meeting;

/**
 * Check if input looks like a file path
 * More robust than just checking extension
 */
function isFilePath(input: string): boolean {
  // Check for common file extensions
  const ext = extname(input).toLowerCase();
  if ([".txt", ".md", ".json"].includes(ext)) {
    return true;
  }

  // Check if it looks like a path (contains path separators or starts with . or /)
  if (input.includes("/") || input.includes("\\") || input.startsWith(".")) {
    // Further validate by checking if file exists
    return existsSync(resolve(input));
  }

  return false;
}

export async function handleMeetingInput(
  input: string
): Promise<CreateMeetingInput> {
  // Determine if input is a file path or direct text
  if (isFilePath(input)) {
    const absolutePath = resolve(input);

    // Run preflight validation
    const preflightResult = validateMeetingFile(input);
    if (!preflightResult.valid) {
      throw new PreflightError(preflightResult, "meeting transcript");
    }

    // Legacy validation for extension check
    const validation = validateFile(input, "document");
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const content = await readFile(absolutePath, "utf-8");
    return {
      transcript: content,
      source: absolutePath,
    };
  }

  // Direct text input - validate length
  if (input.length === 0) {
    throw new ValidationError("Meeting transcript cannot be empty");
  }

  if (input.length > MAX_DIRECT_TEXT_LENGTH) {
    throw new ValidationError(
      `Meeting transcript too long: ${input.length} chars (limit: ${MAX_DIRECT_TEXT_LENGTH}). ` +
      "Consider saving to a file and providing the file path instead."
    );
  }

  return {
    transcript: input,
  };
}
