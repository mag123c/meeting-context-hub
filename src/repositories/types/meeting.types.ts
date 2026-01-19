import { z } from "zod";
import { tagSchema } from "./tag.types";

// PRD Summary 스키마
export const prdSummarySchema = z.object({
  problem: z.string(),
  goal: z.string(),
  scope: z.array(z.string()),
  requirements: z.array(z.string()),
});

export type PRDSummary = z.infer<typeof prdSummarySchema>;

// Embedded Action Item 스키마 (JSONB 필드용)
// 독립 ActionItem 엔티티는 action-item.types.ts 참조
export const embeddedActionItemSchema = z.object({
  assignee: z.string(),
  task: z.string(),
  deadline: z.string().nullable(),
});

export type EmbeddedActionItem = z.infer<typeof embeddedActionItemSchema>;

// Meeting Type
export const meetingTypeSchema = z.enum([
  "standup",
  "planning",
  "retrospective",
  "review",
  "brainstorm",
  "decision",
  "other",
]);
export type MeetingType = z.infer<typeof meetingTypeSchema>;

// Meeting 스키마
// 신규 필드들은 모두 nullable/optional - DB 마이그레이션 후 활성화
export const meetingSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1),
  raw_content: z.string(),
  prd_summary: prdSummarySchema.nullable(),
  action_items: z.array(embeddedActionItemSchema).nullable(),
  obsidian_path: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  // 신규 필드 (nullable/optional, DB 마이그레이션 후 활성화)
  sprint_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  meeting_type: meetingTypeSchema.nullable().optional(),
  meeting_date: z.string().datetime().nullable().optional(),
  participants: z.array(z.string()).nullable().optional(),
});

export type Meeting = z.infer<typeof meetingSchema>;

// Meeting with Tags
export const meetingWithTagsSchema = meetingSchema.extend({
  tags: z.array(tagSchema),
});

export type MeetingWithTags = z.infer<typeof meetingWithTagsSchema>;

// Meeting 생성 입력
export const createMeetingInputSchema = z.object({
  title: z.string().min(1),
  raw_content: z.string(),
  prd_summary: prdSummarySchema.optional(),
  action_items: z.array(embeddedActionItemSchema).optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
  // 신규 필드
  sprint_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  meeting_type: meetingTypeSchema.optional(),
  meeting_date: z.string().datetime().optional(),
  participants: z.array(z.string()).optional(),
});

export type CreateMeetingInput = z.infer<typeof createMeetingInputSchema>;

// Meeting 업데이트 입력
export const updateMeetingInputSchema = z.object({
  title: z.string().min(1).optional(),
  raw_content: z.string().optional(),
  prd_summary: prdSummarySchema.nullable().optional(),
  action_items: z.array(embeddedActionItemSchema).nullable().optional(),
  obsidian_path: z.string().nullable().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
  // 신규 필드
  sprint_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  meeting_type: meetingTypeSchema.nullable().optional(),
  meeting_date: z.string().datetime().nullable().optional(),
  participants: z.array(z.string()).nullable().optional(),
});

export type UpdateMeetingInput = z.infer<typeof updateMeetingInputSchema>;
