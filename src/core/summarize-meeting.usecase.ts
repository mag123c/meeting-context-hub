import { randomUUID } from "crypto";
import type { ClaudeClient } from "../ai/clients/claude.client.js";
import type { EmbeddingClient } from "../ai/clients/embedding.client.js";
import type { ContextRepository } from "../repositories/context.repository.js";
import type { Meeting, MeetingSummary, CreateMeetingInput } from "../types/meeting.types.js";
import { MeetingSummarySchema } from "../types/meeting.schema.js";
import { meetingSummaryPrompt } from "../ai/prompts/meeting-summary.prompt.js";
import { taggingPrompt } from "../ai/prompts/tagging.prompt.js";
import { extractJsonFromMarkdown, safeJsonParse, addRelatedLinks } from "../utils/index.js";

export interface SummarizeMeetingDeps {
  claudeClient: ClaudeClient;
  embeddingClient: EmbeddingClient;
  contextRepository: ContextRepository;
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

    const meetingSummary = this.parseMeetingSummary(summaryResponse);

    // 2. 태그 추출
    const tags = await this.extractTags(claudeClient, input.transcript);

    // 3. project/sprint 결정: CLI 옵션 > AI 추출
    const project = input.project || (meetingSummary.project ?? undefined);
    const sprint = input.sprint || (meetingSummary.sprint ?? undefined);

    // 4. 임베딩 생성 (요약 텍스트 기반)
    const embeddingText = this.buildEmbeddingText(meetingSummary);
    const embedding = await embeddingClient.embed(embeddingText);

    // 5. Meeting 객체 생성
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

    // 6. Obsidian에 저장 (마크다운 형식)
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

    // 7. 관련 문서 링크 추가 (유사도 60% 이상, 최대 5개)
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

  private async extractTags(claudeClient: ClaudeClient, transcript: string): Promise<string[]> {
    const tagResponse = await claudeClient.complete(taggingPrompt, transcript);
    const parsed = safeJsonParse(tagResponse, { tags: [] });
    // 새 포맷 (객체) 또는 구 포맷 (배열) 지원
    return Array.isArray(parsed) ? parsed : (parsed.tags || []);
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
