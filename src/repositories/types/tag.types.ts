import { z } from "zod";

// Tag 스키마
export const tagSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  description: z.string().nullable(),
  created_at: z.string().datetime(),
});

export type Tag = z.infer<typeof tagSchema>;

// Tag 생성 입력
export const createTagInputSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
});

export type CreateTagInput = z.infer<typeof createTagInputSchema>;

// Tag 업데이트 입력
export const updateTagInputSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().nullable().optional(),
});

export type UpdateTagInput = z.infer<typeof updateTagInputSchema>;
