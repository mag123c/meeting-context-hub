import { existsSync } from "fs";
import { resolve } from "path";
import type { CreateContextInput } from "../types/context.types.js";
import { ClaudeClient } from "../ai/clients/claude.client.js";
import { imageSummarizePrompt } from "../ai/prompts/summarize.prompt.js";

const SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

interface ImageAnalysisResult {
  description: string;
  tags: string[];
}

function parseImageAnalysis(response: string): ImageAnalysisResult {
  try {
    // JSON 블록 추출 (마크다운 코드블록 처리)
    let cleaned = response.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);
    return {
      description: parsed.description || "이미지 설명 없음",
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    };
  } catch {
    // JSON 파싱 실패 시 전체를 description으로 사용
    return {
      description: response.trim(),
      tags: [],
    };
  }
}

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

    const response = await this.claude.analyzeImage(imageSummarizePrompt, absolutePath);
    const { description, tags } = parseImageAnalysis(response);

    return {
      type: "image",
      content: description,
      source: absolutePath,
      tags, // 이미지에서 직접 추출한 태그
    };
  }
}
