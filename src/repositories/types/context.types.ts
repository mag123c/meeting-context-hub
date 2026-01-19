import { z } from "zod";
import { tagSchema } from "./tag.types";

// Context Source 타입
export const contextSourceSchema = z.enum([
  "slack",
  "notion",
  "manual",
  "meeting",
]);

export type ContextSource = z.infer<typeof contextSourceSchema>;

// Context Type
export const contextTypeSchema = z.enum([
  "decision",
  "reference",
  "discussion",
  "blocker",
  "update",
  "idea",
  "other",
]);
export type ContextType = z.infer<typeof contextTypeSchema>;

// Importance Level
export const importanceSchema = z.enum(["low", "medium", "high"]);
export type Importance = z.infer<typeof importanceSchema>;

// Context 스키마
// 신규 필드들은 모두 nullable/optional - DB 마이그레이션 후 활성화
export const contextSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  source: contextSourceSchema,
  source_id: z.string().nullable(),
  content: z.string(),
  obsidian_path: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  // 신규 필드 (nullable/optional, DB 마이그레이션 후 활성화)
  sprint_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  title: z.string().nullable().optional(),
  context_type: contextTypeSchema.nullable().optional(),
  importance: importanceSchema.nullable().optional(),
  source_url: z.string().url().nullable().optional(),
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
  // 신규 필드
  sprint_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  title: z.string().optional(),
  context_type: contextTypeSchema.optional(),
  importance: importanceSchema.optional(),
  source_url: z.string().url().optional(),
});

export type CreateContextInput = z.infer<typeof createContextInputSchema>;

// Context 업데이트 입력
export const updateContextInputSchema = z.object({
  content: z.string().min(1).optional(),
  obsidian_path: z.string().nullable().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
  // 신규 필드
  sprint_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  title: z.string().nullable().optional(),
  context_type: contextTypeSchema.nullable().optional(),
  importance: importanceSchema.nullable().optional(),
  source_url: z.string().url().nullable().optional(),
});

export type UpdateContextInput = z.infer<typeof updateContextInputSchema>;
