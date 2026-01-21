import { randomUUID } from "crypto";
import type { ILLMClient, IEmbeddingClient } from "../ai/interfaces/index.js";
import type { ContextRepository } from "../repositories/context.repository.js";
import type { Meeting, MeetingSummary, CreateMeetingInput } from "../types/meeting.types.js";
import { MeetingSummarySchema } from "../types/meeting.schema.js";
import { meetingSummaryPrompt } from "../ai/prompts/meeting-summary.prompt.js";
import { taggingPrompt } from "../ai/prompts/tagging.prompt.js";
import { extractJsonFromMarkdown, safeJsonParse, addRelatedLinks, formatMeetingMarkdown } from "../utils/index.js";

export interface SummarizeMeetingDeps {
  llmClient: ILLMClient;
  embeddingClient: IEmbeddingClient;
  contextRepository: ContextRepository;
}

export class SummarizeMeetingUseCase {
  constructor(private deps: SummarizeMeetingDeps) {}

  async execute(input: CreateMeetingInput): Promise<Meeting> {
    const { llmClient, embeddingClient, contextRepository } = this.deps;

    // 1. Extract meeting summary + tags in parallel
    const [summaryResponse, tagResponse] = await Promise.all([
      llmClient.complete(meetingSummaryPrompt, input.transcript),
      llmClient.complete(taggingPrompt, input.transcript),
    ]);

    const meetingSummary = this.parseMeetingSummary(summaryResponse);
    const parsed = safeJsonParse(tagResponse, { tags: [] });
    const tags: string[] = Array.isArray(parsed) ? parsed : (parsed.tags || []);

    // 2. Determine project/sprint: CLI option > AI extraction
    const project = input.project || (meetingSummary.project ?? undefined);
    const sprint = input.sprint || (meetingSummary.sprint ?? undefined);

    // 3. Generate embedding (based on summary text)
    const embeddingText = this.buildEmbeddingText(meetingSummary);
    const embedding = await embeddingClient.embed(embeddingText);

    // 5. Create Meeting object
    const now = new Date();
    const meeting: Meeting = {
      id: randomUUID(),
      transcript: input.transcript,
      summary: meetingSummary,
      tags,
      embedding,
      createdAt: now,
      updatedAt: now,
    };

    // 6. Save to Obsidian (markdown format)
    const markdownContent = formatMeetingMarkdown(meeting, { project, sprint });
    await contextRepository.save({
      id: meeting.id,
      type: "text",
      content: markdownContent,
      summary: meetingSummary.summary,
      tags: [...tags, "meeting"],
      embedding,
      source: input.source,
      project,
      sprint,
      createdAt: now,
      updatedAt: now,
    });

    // 7. Add related document links (60%+ similarity, max 5)
    await addRelatedLinks(contextRepository, meeting.id, embedding);

    return meeting;
  }

  private parseMeetingSummary(response: string): MeetingSummary {
    try {
      const cleanedJSON = extractJsonFromMarkdown(response);
      const parsed = JSON.parse(cleanedJSON);
      return MeetingSummarySchema.parse(parsed);
    } catch {
      throw new Error("Failed to parse meeting summary: " + response);
    }
  }

  private buildEmbeddingText(summary: MeetingSummary): string {
    const keyPointsText = summary.keyPoints.join(" ");
    return `${summary.title} ${summary.summary} ${keyPointsText}`;
  }
}
