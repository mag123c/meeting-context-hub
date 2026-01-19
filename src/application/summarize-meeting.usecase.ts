import type { MeetingRepository } from "@/repositories/meeting.repository";
import type { TagRepository } from "@/repositories/tag.repository";
import type { MeetingWithTags, CreateMeetingInput } from "@/repositories/types";
import { callClaude } from "@/lib/ai/claude";
import { MEETING_SUMMARY_PROMPT } from "@/lib/ai/prompts";
import { obsidianStorage } from "@/storage/obsidian";

export interface SummarizeMeetingInput {
  title: string;
  rawContent: string;
}

export class SummarizeMeetingUseCase {
  constructor(
    private meetingRepo: MeetingRepository,
    private tagRepo: TagRepository
  ) {}

  async execute(
    userId: string,
    input: SummarizeMeetingInput
  ): Promise<MeetingWithTags> {
    // 1. Claude로 회의록 요약
    const summary = await callClaude(
      MEETING_SUMMARY_PROMPT,
      `다음 회의록을 분석해주세요:\n\n${input.rawContent}`
    );

    // 2. 태그 생성/조회
    const tags = await this.tagRepo.findOrCreateByNames(summary.suggestedTags);
    const tagIds = tags.map((t) => t.id);

    // 3. Meeting 생성
    const createInput: CreateMeetingInput = {
      title: input.title,
      raw_content: input.rawContent,
      prd_summary: summary.prd,
      action_items: summary.actionItems,
      tag_ids: tagIds,
    };

    const meeting = await this.meetingRepo.create(userId, createInput);

    // 4. Meeting 다시 조회 (tags 포함)
    const meetingWithTags = await this.meetingRepo.getById(meeting.id);
    if (!meetingWithTags) {
      throw new Error("Failed to retrieve created meeting");
    }

    // 5. Obsidian 파일 생성
    const obsidianPath = await obsidianStorage.writeMeeting(meetingWithTags);

    // 6. obsidian_path 업데이트
    await this.meetingRepo.update(meeting.id, { obsidian_path: obsidianPath });

    return { ...meetingWithTags, obsidian_path: obsidianPath };
  }
}
