import { randomUUID } from "crypto";
import type { ContextRepository } from "../repositories/context.repository.js";
import type { Context, CreateContextInput } from "../types/context.types.js";
import { ClaudeClient } from "../ai/clients/claude.client.js";
import { EmbeddingClient } from "../ai/clients/embedding.client.js";
import { taggingPrompt, imageTaggingPrompt } from "../ai/prompts/tagging.prompt.js";
import { summarizePrompt } from "../ai/prompts/summarize.prompt.js";

export class AddContextUseCase {
  constructor(
    private repository: ContextRepository,
    private claude: ClaudeClient,
    private embedding: EmbeddingClient
  ) {}

  async execute(input: CreateContextInput): Promise<Context> {
    const prompt = input.type === "image" ? imageTaggingPrompt : taggingPrompt;
    const tagsJson = await this.claude.complete(prompt, input.content);
    const tags = this.parseTags(tagsJson);

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
