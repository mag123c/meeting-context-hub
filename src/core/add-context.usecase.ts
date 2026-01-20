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
    // AI로 메타데이터 추출 (tags, project, sprint)
    let tags: string[];
    let project: string | undefined = input.project; // CLI 옵션 우선
    let sprint: string | undefined = input.sprint;   // CLI 옵션 우선

    if (input.tags && input.tags.length > 0) {
      // 이미지 등 미리 추출된 태그가 있으면 사용
      tags = input.tags;
    } else {
      // AI로 메타데이터 추출
      const metadataJson = await this.claude.complete(taggingPrompt, input.content);
      const metadata = this.parseMetadata(metadataJson);
      tags = metadata.tags;
      // CLI 옵션이 없을 때만 AI 추론 결과 사용
      if (!project) project = metadata.project;
      if (!sprint) sprint = metadata.sprint;
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
      project,
      sprint,
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.save(context);

    // 관련 문서 찾아서 링크 추가 (유사도 70% 이상, 최대 5개)
    await this.addRelatedLinks(context);

    return context;
  }

  private async addRelatedLinks(context: Context): Promise<void> {
    if (!context.embedding || context.embedding.length === 0) return;

    try {
      const similar = await this.repository.findSimilar(context.embedding, 6);
      // 자기 자신 제외, 유사도 70% 이상만
      const related = similar
        .filter((s) => s.id !== context.id && s.similarity >= 0.6)
        .slice(0, 5);

      if (related.length > 0) {
        await this.repository.appendRelatedLinks(
          context.id,
          related.map((r) => r.id)
        );
      }
    } catch {
      // 관련 문서 링크 실패해도 무시
    }
  }

  private parseMetadata(json: string): { tags: string[]; project?: string; sprint?: string } {
    try {
      // JSON 객체 추출
      const match = json.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          tags: Array.isArray(parsed.tags)
            ? parsed.tags.filter((t: unknown): t is string => typeof t === "string")
            : [],
          project: typeof parsed.project === "string" && parsed.project !== "null" ? parsed.project : undefined,
          sprint: typeof parsed.sprint === "string" && parsed.sprint !== "null" ? parsed.sprint : undefined,
        };
      }
      // 폴백: 기존 배열 형식
      const arrayMatch = json.match(/\[[\s\S]*?\]/);
      if (arrayMatch) {
        const parsed = JSON.parse(arrayMatch[0]);
        return {
          tags: Array.isArray(parsed)
            ? parsed.filter((t: unknown): t is string => typeof t === "string")
            : [],
        };
      }
      return { tags: [] };
    } catch {
      return { tags: [] };
    }
  }
}
