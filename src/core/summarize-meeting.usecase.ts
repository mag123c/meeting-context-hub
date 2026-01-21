import { randomUUID } from "crypto";
import type { ILLMClient, IEmbeddingClient } from "../ai/interfaces/index.js";
import type { ContextRepository } from "../repositories/context.repository.js";
import type { Meeting, MeetingSummary, CreateMeetingInput } from "../types/meeting.types.js";
import { MeetingSummarySchema } from "../types/meeting.schema.js";
import { meetingSummaryPrompt } from "../ai/prompts/meeting-summary.prompt.js";
import { taggingPrompt } from "../ai/prompts/tagging.prompt.js";
import { extractJsonFromMarkdown, safeJsonParse, addRelatedLinks } from "../utils/index.js";

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
    const markdownContent = this.formatMeetingMarkdown(meeting, project, sprint);
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

  private formatMeetingMarkdown(meeting: Meeting, project?: string, sprint?: string): string {
    const { summary } = meeting;
    const lines: string[] = [];

    lines.push("# " + summary.title);
    lines.push("");

    if (summary.date) {
      lines.push("**일시**: " + summary.date);
    }
    if (summary.participants.length > 0) {
      lines.push("**참석자**: " + summary.participants.join(", "));
    }
    if (project) {
      lines.push("**프로젝트**: " + project);
    }
    if (sprint) {
      lines.push("**스프린트**: " + sprint);
    }
    lines.push("");

    lines.push("## 📋 회의 요약");
    lines.push(summary.summary);
    lines.push("");

    if (summary.decisions.length > 0) {
      lines.push("## 🎯 핵심 결정사항");
      summary.decisions.forEach((d) => lines.push("- " + d));
      lines.push("");
    }

    if (summary.actionItems.length > 0) {
      lines.push("## ✅ Action Items");
      lines.push("| 할 일 | 담당자 | 기한 |");
      lines.push("|-------|--------|------|");
      summary.actionItems.forEach((item) => {
        const assignee = item.assignee || "-";
        const deadline = item.deadline || "-";
        lines.push("| " + item.task + " | " + assignee + " | " + deadline + " |");
      });
      lines.push("");
    }

    if (summary.keyPoints.length > 0) {
      lines.push("## 💡 주요 논의 포인트");
      summary.keyPoints.forEach((p) => lines.push("- " + p));
      lines.push("");
    }

    if (summary.openIssues.length > 0) {
      lines.push("## ❓ 미해결 이슈");
      summary.openIssues.forEach((i) => lines.push("- " + i));
      lines.push("");
    }

    if (summary.nextSteps.length > 0) {
      lines.push("## 📅 다음 단계");
      summary.nextSteps.forEach((s) => lines.push("- " + s));
      lines.push("");
    }

    return lines.join("\n");
  }
}
