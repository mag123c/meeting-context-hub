import { z } from "zod";

// Squad 스키마
export const squadSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  slack_channel_id: z.string().nullable(),
  notion_workspace_id: z.string().nullable(),
  created_at: z.string().datetime(),
});
export type Squad = z.infer<typeof squadSchema>;

// Squad 생성 입력
export const createSquadInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  slack_channel_id: z.string().optional(),
  notion_workspace_id: z.string().optional(),
});
export type CreateSquadInput = z.infer<typeof createSquadInputSchema>;

// Squad 업데이트 입력
export const updateSquadInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  slack_channel_id: z.string().nullable().optional(),
  notion_workspace_id: z.string().nullable().optional(),
});
export type UpdateSquadInput = z.infer<typeof updateSquadInputSchema>;
