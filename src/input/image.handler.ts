import { existsSync } from "fs";
import { resolve } from "path";
import type { CreateContextInput } from "../types/context.types.js";
import { ClaudeClient } from "../ai/clients/claude.client.js";
import { imageSummarizePrompt } from "../ai/prompts/summarize.prompt.js";

const SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

export class ImageHandler {
  constructor(private claude: ClaudeClient) {}

  async handle(imagePath: string): Promise<CreateContextInput> {
    const absolutePath = resolve(imagePath);
    
    if (!existsSync(absolutePath)) {
      throw new Error("Image file not found: " + absolutePath);
    }

    const ext = absolutePath.toLowerCase().split(".").pop();
    if (!ext || !SUPPORTED_EXTENSIONS.includes("." + ext)) {
      throw new Error("Unsupported image format. Supported: " + SUPPORTED_EXTENSIONS.join(", "));
    }

    const description = await this.claude.analyzeImage(imageSummarizePrompt, absolutePath);

    return {
      type: "image",
      content: description,
      source: absolutePath,
    };
  }
}
