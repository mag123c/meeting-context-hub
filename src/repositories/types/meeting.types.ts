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

// Action Item 스키마
export const actionItemSchema = z.object({
  assignee: z.string(),
  task: z.string(),
  deadline: z.string().nullable(),
});

export type ActionItem = z.infer<typeof actionItemSchema>;

// Meeting 스키마
export const meetingSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1),
  raw_content: z.string(),
  prd_summary: prdSummarySchema.nullable(),
  action_items: z.array(actionItemSchema).nullable(),
  obsidian_path: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
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
  action_items: z.array(actionItemSchema).optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
});

export type CreateMeetingInput = z.infer<typeof createMeetingInputSchema>;

// Meeting 업데이트 입력
export const updateMeetingInputSchema = z.object({
  title: z.string().min(1).optional(),
  raw_content: z.string().optional(),
  prd_summary: prdSummarySchema.nullable().optional(),
  action_items: z.array(actionItemSchema).nullable().optional(),
  obsidian_path: z.string().nullable().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
});

export type UpdateMeetingInput = z.infer<typeof updateMeetingInputSchema>;
