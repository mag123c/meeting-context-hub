import { z } from "zod";

// Project Status
export const projectStatusSchema = z.enum([
  "ideation",
  "active",
  "paused",
  "completed",
  "archived",
]);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

// Project 스키마
export const projectSchema = z.object({
  id: z.string().uuid(),
  squad_id: z.string().uuid().nullable(),
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  status: projectStatusSchema.default("ideation"),
  goal: z.string().nullable(),
  start_date: z.string().date().nullable(),
  target_date: z.string().date().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Project = z.infer<typeof projectSchema>;

// Project 생성 입력
export const createProjectInputSchema = z.object({
  squad_id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  status: projectStatusSchema.optional(),
  goal: z.string().optional(),
  start_date: z.string().date().optional(),
  target_date: z.string().date().optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

// Project 업데이트 입력
export const updateProjectInputSchema = z.object({
  squad_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  status: projectStatusSchema.optional(),
  goal: z.string().nullable().optional(),
  start_date: z.string().date().nullable().optional(),
  target_date: z.string().date().nullable().optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;
