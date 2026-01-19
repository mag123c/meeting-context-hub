import { z } from "zod";

// Sprint Status
export const sprintStatusSchema = z.enum([
  "planning",
  "active",
  "completed",
  "cancelled",
]);
export type SprintStatus = z.infer<typeof sprintStatusSchema>;

// Sprint 스키마
export const sprintSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  goal: z.string().nullable(),
  status: sprintStatusSchema.default("planning"),
  start_date: z.string().date(),
  end_date: z.string().date(),
  retrospective: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Sprint = z.infer<typeof sprintSchema>;

// Sprint 생성 입력
export const createSprintInputSchema = sprintSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type CreateSprintInput = z.infer<typeof createSprintInputSchema>;

// Sprint 업데이트 입력
export const updateSprintInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  goal: z.string().nullable().optional(),
  status: sprintStatusSchema.optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  retrospective: z.string().nullable().optional(),
});
export type UpdateSprintInput = z.infer<typeof updateSprintInputSchema>;
