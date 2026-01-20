import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import type { Prompt } from "../../types/prompt.types.js";

export class ClaudeClient {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async complete(prompt: Prompt, input: string): Promise<string> {
    const message = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: prompt.system,
      messages: [
        { role: "user", content: prompt.template(input) },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }
    return textBlock.text;
  }

  async analyzeImage(prompt: Prompt, imagePath: string): Promise<string> {
    const imageData = await readFile(imagePath);
    const base64 = imageData.toString("base64");
    const mediaType = this.getMediaType(imagePath);

    const message = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: prompt.system,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            { type: "text", text: prompt.template("") },
          ],
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }
    return textBlock.text;
  }

  private getMediaType(path: string): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
    const ext = path.toLowerCase().split(".").pop();
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      case "webp":
        return "image/webp";
      default:
        return "image/png";
    }
  }
}
