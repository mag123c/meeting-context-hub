import { randomUUID } from "crypto";
import type { ContextRepository } from "../repositories/context.repository.js";
import type { Context, CreateContextInput } from "../types/context.types.js";
import type { ILLMClient, IEmbeddingClient } from "../ai/interfaces/index.js";
import { taggingPrompt } from "../ai/prompts/tagging.prompt.js";
import { summarizePrompt } from "../ai/prompts/summarize.prompt.js";
import { parseMetadata, addRelatedLinks } from "../utils/index.js";

export class AddContextUseCase {
  constructor(
    private repository: ContextRepository,
    private llm: ILLMClient,
    private embedding: IEmbeddingClient
  ) {}

  async execute(input: CreateContextInput): Promise<Context> {
    let tags: string[];
    let project: string | undefined = input.project; // CLI 옵션 우선
    let sprint: string | undefined = input.sprint;   // CLI 옵션 우선
    let summary: string;
    let embeddingVector: number[];

    // 이미지: 태그, 요약 이미 있음 → 임베딩만 호출
    if (input.tags && input.tags.length > 0) {
      tags = input.tags;
      summary = input.content; // 이미지는 content가 이미 요약
      embeddingVector = await this.embedding.embed(input.content);
    } else {
      // 일반 컨텐츠: 태그/메타데이터, 요약, 임베딩 병렬 호출
      const [metadataJson, summaryResult, embedding] = await Promise.all([
        this.llm.complete(taggingPrompt, input.content),
        input.type === "image"
          ? Promise.resolve(input.content)
          : this.llm.complete(summarizePrompt, input.content),
        this.embedding.embed(input.content),
      ]);

      const metadata = parseMetadata(metadataJson);
      tags = metadata.tags;
      summary = summaryResult;
      embeddingVector = embedding;

      // CLI 옵션이 없을 때만 AI 추론 결과 사용
      if (!project) project = metadata.project;
      if (!sprint) sprint = metadata.sprint;
    }

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

    // 관련 문서 찾아서 링크 추가 (유사도 60% 이상, 최대 5개)
    await addRelatedLinks(this.repository, context.id, context.embedding!);

    return context;
  }
}
