import { randomUUID } from "crypto";
import type { ContextRepository } from "../repositories/context.repository.js";
import type { Context, CreateContextInput } from "../types/context.types.js";
import { ClaudeClient } from "../ai/clients/claude.client.js";
import { EmbeddingClient } from "../ai/clients/embedding.client.js";
import { taggingPrompt } from "../ai/prompts/tagging.prompt.js";
import { summarizePrompt } from "../ai/prompts/summarize.prompt.js";

export class AddContextUseCase {
  constructor(
    private repository: ContextRepository,
    private claude: ClaudeClient,
    private embedding: EmbeddingClient
  ) {}

  async execute(input: CreateContextInput): Promise<Context> {
    // 태그: 이미 있으면 사용, 없으면 Claude로 추출
    let tags: string[];
    if (input.tags && input.tags.length > 0) {
      tags = input.tags;
    } else {
      const tagsJson = await this.claude.complete(taggingPrompt, input.content);
      tags = this.parseTags(tagsJson);
    }

    // 요약: 이미지는 content가 이미 요약, 나머지는 Claude로 생성
    const summary = input.type === "image"
      ? input.content
      : await this.claude.complete(summarizePrompt, input.content);

    const embeddingVector = await this.embedding.embed(input.content);

    const now = new Date();
    const context: Context = {
      id: randomUUID(),
      type: input.type,
      content: input.content,
      summary: summary.trim(),
      tags,
      embedding: embeddingVector,
      source: input.source,
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.save(context);
    return context;
  }

  private parseTags(json: string): string[] {
    try {
      const match = json.match(/\[[\s\S]*?\]/);
      if (!match) return [];
      const parsed = JSON.parse(match[0]);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((t): t is string => typeof t === "string");
    } catch {
      return [];
    }
  }
}
