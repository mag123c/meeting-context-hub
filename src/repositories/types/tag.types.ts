import { z } from "zod";

// Tag Type
export const tagTypeSchema = z.enum([
  "category",
  "status",
  "priority",
  "custom",
]);
export type TagType = z.infer<typeof tagTypeSchema>;

// Tag Scope
export const tagScopeSchema = z.enum(["global", "squad", "project"]);
export type TagScope = z.infer<typeof tagScopeSchema>;

// Tag 스키마
// 신규 필드들은 모두 nullable/optional - DB 마이그레이션 후 활성화
export const tagSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  description: z.string().nullable(),
  created_at: z.string().datetime(),
  // 신규 필드 (nullable/optional, DB 마이그레이션 후 활성화)
  tag_type: tagTypeSchema.nullable().optional(),
  scope: tagScopeSchema.nullable().optional(),
  scope_id: z.string().uuid().nullable().optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
});

export type Tag = z.infer<typeof tagSchema>;

// Tag 생성 입력
export const createTagInputSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  // 신규 필드
  tag_type: tagTypeSchema.optional(),
  scope: tagScopeSchema.optional(),
  scope_id: z.string().uuid().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export type CreateTagInput = z.infer<typeof createTagInputSchema>;

// Tag 업데이트 입력
export const updateTagInputSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().nullable().optional(),
  // 신규 필드
  tag_type: tagTypeSchema.nullable().optional(),
  scope: tagScopeSchema.nullable().optional(),
  scope_id: z.string().uuid().nullable().optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
});

export type UpdateTagInput = z.infer<typeof updateTagInputSchema>;
