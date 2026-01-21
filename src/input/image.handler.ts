import type { CreateContextInput } from "../types/context.types.js";
import { ClaudeClient } from "../ai/clients/claude.client.js";
import { imageSummarizePrompt } from "../ai/prompts/summarize.prompt.js";
import { validateFile, extractJsonFromMarkdown, safeJsonParse } from "../utils/index.js";

interface ImageAnalysisResult {
  description: string;
  tags: string[];
}

function parseImageAnalysis(response: string): ImageAnalysisResult {
  const cleaned = extractJsonFromMarkdown(response);
  const parsed = safeJsonParse<{ description?: string; tags?: string[] }>(cleaned, {});

  if (parsed.description) {
    return {
      description: parsed.description,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    };
  }

  // Use entire response as description if JSON parsing fails
  return {
    description: response.trim(),
    tags: [],
  };
}

export class ImageHandler {
  constructor(private claude: ClaudeClient) {}

  async handle(imagePath: string): Promise<CreateContextInput> {
    const validation = validateFile(imagePath, "image");
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const response = await this.claude.analyzeImage(imageSummarizePrompt, validation.absolutePath);
    const { description, tags } = parseImageAnalysis(response);

    return {
      type: "image",
      content: description,
      source: validation.absolutePath,
      tags, // Tags directly extracted from image
    };
  }
}
