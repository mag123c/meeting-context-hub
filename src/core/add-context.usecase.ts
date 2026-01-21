import { randomUUID } from "crypto";
import type { ContextRepository } from "../repositories/context.repository.js";
import type { Context, CreateContextInput } from "../types/context.types.js";
import type { ILLMClient, IEmbeddingClient } from "../ai/interfaces/index.js";
import { taggingPrompt } from "../ai/prompts/tagging.prompt.js";
import { summarizePrompt } from "../ai/prompts/summarize.prompt.js";
import { parseMetadata, addRelatedLinks } from "../utils/index.js";
import type { HierarchyService } from "./hierarchy.service.js";

export class AddContextUseCase {
  constructor(
    private repository: ContextRepository,
    private llm: ILLMClient,
    private embedding: IEmbeddingClient,
    private hierarchyService?: HierarchyService
  ) {}

  async execute(input: CreateContextInput): Promise<Context> {
    let tags: string[];
    let project: string | undefined = input.project;   // CLI option takes priority
    let category: string | undefined = input.category; // CLI option takes priority
    let sprint: string | undefined = input.sprint;     // CLI option takes priority
    let summary: string;
    let embeddingVector: number[];

    // Image: tags and summary already extracted → only call embedding
    if (input.tags && input.tags.length > 0) {
      tags = input.tags;
      summary = input.content; // Image content is already the summary
      embeddingVector = await this.embedding.embed(input.content);
    } else {
      // Regular content: parallel calls for tags/metadata, summary, embedding
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

      // Use AI inference only when CLI options not provided
      if (!project) project = metadata.project;
      if (!sprint) sprint = metadata.sprint;
    }

    // AI-based hierarchy classification (if service available and not already specified)
    if (this.hierarchyService && (!project || !category)) {
      const placement = await this.hierarchyService.classify(
        summary || input.content.slice(0, 500),
        tags,
        input.type
      );

      // Only use AI classification if CLI options not provided
      if (!project) project = placement.project;
      if (!category) category = placement.category;

      // Ensure folder structure exists
      await this.hierarchyService.ensureFolderPath(project, category);
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
      category,
      sprint,
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.save(context);

    // Find similar documents and add related links (60%+ similarity, max 5)
    await addRelatedLinks(this.repository, context.id, context.embedding!);

    return context;
  }
}
