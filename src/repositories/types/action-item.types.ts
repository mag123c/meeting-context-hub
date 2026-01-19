import { z } from "zod";

// ActionItem Status
export const actionItemStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);
export type ActionItemStatus = z.infer<typeof actionItemStatusSchema>;

// ActionItem Priority
export const actionItemPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "urgent",
]);
export type ActionItemPriority = z.infer<typeof actionItemPrioritySchema>;

// ActionItem 스키마 (독립 엔티티)
export const actionItemSchema = z.object({
  id: z.string().uuid(),
  sprint_id: z.string().uuid().nullable(),
  meeting_id: z.string().uuid().nullable(),
  assignee_name: z.string().min(1),
  task: z.string().min(1),
  status: actionItemStatusSchema.default("pending"),
  priority: actionItemPrioritySchema.default("medium"),
  deadline: z.string().date().nullable(),
  completed_at: z.string().datetime().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type ActionItem = z.infer<typeof actionItemSchema>;

// ActionItem 생성 입력
export const createActionItemInputSchema = z.object({
  sprint_id: z.string().uuid().optional(),
  meeting_id: z.string().uuid().optional(),
  assignee_name: z.string().min(1),
  task: z.string().min(1),
  status: actionItemStatusSchema.optional(),
  priority: actionItemPrioritySchema.optional(),
  deadline: z.string().date().optional(),
  notes: z.string().optional(),
});
export type CreateActionItemInput = z.infer<typeof createActionItemInputSchema>;

// ActionItem 업데이트 입력
export const updateActionItemInputSchema = z.object({
  sprint_id: z.string().uuid().nullable().optional(),
  meeting_id: z.string().uuid().nullable().optional(),
  assignee_name: z.string().min(1).optional(),
  task: z.string().min(1).optional(),
  status: actionItemStatusSchema.optional(),
  priority: actionItemPrioritySchema.optional(),
  deadline: z.string().date().nullable().optional(),
  completed_at: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type UpdateActionItemInput = z.infer<typeof updateActionItemInputSchema>;
