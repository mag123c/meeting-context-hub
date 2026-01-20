import { randomUUID } from "crypto";
import type { ClaudeClient } from "../ai/clients/claude.client.js";
import type { EmbeddingClient } from "../ai/clients/embedding.client.js";
import type { ContextRepository } from "../repositories/context.repository.js";
import type { Meeting, MeetingSummary, CreateMeetingInput } from "../types/meeting.types.js";
import { MeetingSummarySchema } from "../types/meeting.schema.js";
import { meetingSummaryPrompt } from "../ai/prompts/meeting-summary.prompt.js";
import { taggingPrompt } from "../ai/prompts/tagging.prompt.js";

export interface SummarizeMeetingDeps {
  claudeClient: ClaudeClient;
  embeddingClient: EmbeddingClient;
  contextRepository: ContextRepository;
}

function extractJSON(text: string): string {
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

export class SummarizeMeetingUseCase {
  constructor(private deps: SummarizeMeetingDeps) {}

  async execute(input: CreateMeetingInput): Promise<Meeting> {
    const { claudeClient, embeddingClient, contextRepository } = this.deps;

    // 1. 회의록 요약 추출
    const summaryResponse = await claudeClient.complete(
      meetingSummaryPrompt,
      input.transcript
    );

    let meetingSummary: MeetingSummary;
    try {
      const cleanedJSON = extractJSON(summaryResponse);
      const parsed = JSON.parse(cleanedJSON);
      meetingSummary = MeetingSummarySchema.parse(parsed);
    } catch {
      throw new Error("Failed to parse meeting summary: " + summaryResponse);
    }

    // 2. 태그 추출
    const tagResponse = await claudeClient.complete(
      taggingPrompt,
      input.transcript
    );

    let tags: string[];
    try {
      const cleanedTags = extractJSON(tagResponse);
      tags = JSON.parse(cleanedTags);
    } catch {
      tags = [];
    }

    // 3. 임베딩 생성 (요약 텍스트 기반)
    const keyPointsText = meetingSummary.keyPoints.join(" ");
    const embeddingText = meetingSummary.title + " " + meetingSummary.summary + " " + keyPointsText;
    const embedding = await embeddingClient.embed(embeddingText);

    // 4. Meeting 객체 생성
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

    // 5. Obsidian에 저장 (마크다운 형식)
    const markdownContent = this.formatMeetingMarkdown(meeting);
    await contextRepository.save({
      id: meeting.id,
      type: "text",
      content: markdownContent,
      summary: meetingSummary.summary,
      tags: [...tags, "meeting"],
      embedding,
      source: input.source,
      createdAt: now,
      updatedAt: now,
    });

    return meeting;
  }

  private formatMeetingMarkdown(meeting: Meeting): string {
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
