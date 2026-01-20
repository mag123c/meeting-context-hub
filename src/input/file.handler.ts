import { readFile } from "fs/promises";
import type { CreateContextInput } from "../types/context.types.js";
import { validateFile } from "../utils/index.js";

export class FileHandler {
  async handle(filePath: string): Promise<CreateContextInput> {
    const validation = validateFile(filePath, "document");
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const content = await readFile(validation.absolutePath, "utf-8");

    return {
      type: "file",
      content: content,
      source: validation.absolutePath,
    };
  }
}
