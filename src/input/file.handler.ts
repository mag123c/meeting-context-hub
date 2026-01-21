import { readFile } from "fs/promises";
import { resolve } from "path";
import type { CreateContextInput } from "../types/context.types.js";
import { validateFile } from "../utils/index.js";
import { validateDocumentFile } from "../utils/preflight/index.js";
import { PreflightError } from "../errors/index.js";

export class FileHandler {
  async handle(filePath: string): Promise<CreateContextInput> {
    const absolutePath = resolve(filePath);

    // Run preflight validation (size, permissions, encoding, symlink check)
    const preflightResult = validateDocumentFile(filePath);
    if (!preflightResult.valid) {
      throw new PreflightError(preflightResult, "file processing");
    }

    // Legacy validation for extension check
    const validation = validateFile(filePath, "document");
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const content = await readFile(absolutePath, "utf-8");

    return {
      type: "file",
      content: content,
      source: absolutePath,
    };
  }
}
