import { z } from "zod";
import { tagSchema } from "./tag.types";

// Context Source 타입
export const contextSourceSchema = z.enum(["slack", "notion", "manual", "meeting"]);

export type ContextSource = z.infer<typeof contextSourceSchema>;

// Context 스키마
export const contextSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  source: contextSourceSchema,
  source_id: z.string().nullable(),
  content: z.string(),
  obsidian_path: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Context = z.infer<typeof contextSchema>;

// Context with Tags
export const contextWithTagsSchema = contextSchema.extend({
  tags: z.array(tagSchema),
});

export type ContextWithTags = z.infer<typeof contextWithTagsSchema>;

// Context 생성 입력
export const createContextInputSchema = z.object({
  source: contextSourceSchema,
  source_id: z.string().optional(),
  content: z.string().min(1),
  tag_ids: z.array(z.string().uuid()).optional(),
});

export type CreateContextInput = z.infer<typeof createContextInputSchema>;

// Context 업데이트 입력
export const updateContextInputSchema = z.object({
  content: z.string().min(1).optional(),
  obsidian_path: z.string().nullable().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
});

export type UpdateContextInput = z.infer<typeof updateContextInputSchema>;
