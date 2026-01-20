import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { resolve } from "path";
import type { CreateContextInput } from "../types/context.types.js";

const SUPPORTED_EXTENSIONS = [".txt", ".md", ".csv", ".json"];

export class FileHandler {
  async handle(filePath: string): Promise<CreateContextInput> {
    const absolutePath = resolve(filePath);
    
    if (!existsSync(absolutePath)) {
      throw new Error("File not found: " + absolutePath);
    }

    const ext = absolutePath.toLowerCase().split(".").pop();
    if (!ext || !SUPPORTED_EXTENSIONS.includes("." + ext)) {
      throw new Error("Unsupported file format. Supported: " + SUPPORTED_EXTENSIONS.join(", "));
    }

    const content = await readFile(absolutePath, "utf-8");

    return {
      type: "file",
      content: content,
      source: absolutePath,
    };
  }
}
