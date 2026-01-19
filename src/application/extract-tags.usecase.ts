import type { ContextRepository } from "@/repositories/context.repository";
import type { TagRepository } from "@/repositories/tag.repository";
import type {
  ContextWithTags,
  CreateContextInput,
  ContextSource,
} from "@/repositories/types";
import { callClaude } from "@/lib/ai/claude";
import {
  CONTEXT_TAGGING_PROMPT,
  buildContextTaggingPrompt,
} from "@/lib/ai/prompts";
import { obsidianStorage } from "@/storage/obsidian";

export interface ExtractTagsInput {
  source: ContextSource;
  sourceId?: string;
  content: string;
}

export class ExtractTagsUseCase {
  constructor(
    private contextRepo: ContextRepository,
    private tagRepo: TagRepository
  ) {}

  async execute(
    userId: string,
    input: ExtractTagsInput
  ): Promise<ContextWithTags> {
    // 1. 기존 태그 목록 조회
    const existingTags = await this.tagRepo.list();
    const existingTagNames = existingTags.map((t) => t.name);

    // 2. Claude로 태그 추출
    const prompt = buildContextTaggingPrompt(input.content, existingTagNames);
    const taggingResult = await callClaude(CONTEXT_TAGGING_PROMPT, prompt);

    // 3. 기존 태그 ID 조회
    const existingTagIds: string[] = [];
    for (const tagName of taggingResult.existingTags) {
      const tag = existingTags.find((t) => t.name === tagName);
      if (tag) {
        existingTagIds.push(tag.id);
      }
    }

    // 4. 새 태그 생성
    const newTagIds: string[] = [];
    for (const newTag of taggingResult.newTags) {
      const tag = await this.tagRepo.create({
        name: newTag.name,
        description: newTag.description,
      });
      newTagIds.push(tag.id);
    }

    const allTagIds = [...existingTagIds, ...newTagIds];

    // 5. Context 생성
    const createInput: CreateContextInput = {
      source: input.source,
      source_id: input.sourceId,
      content: input.content,
      tag_ids: allTagIds,
    };

    const context = await this.contextRepo.create(userId, createInput);

    // 6. Context 다시 조회 (tags 포함)
    const contextWithTags = await this.contextRepo.getById(context.id);
    if (!contextWithTags) {
      throw new Error("Failed to retrieve created context");
    }

    // 7. Obsidian 파일 생성
    const obsidianPath = await obsidianStorage.writeContext(contextWithTags);

    // 8. obsidian_path 업데이트
    await this.contextRepo.update(context.id, { obsidian_path: obsidianPath });

    return { ...contextWithTags, obsidian_path: obsidianPath };
  }
}
