import { z } from "zod";

export const ActionItemSchema = z.object({
  task: z.string(),
  assignee: z.string().nullable(),
  deadline: z.string().nullable(),
});

export const MeetingSummarySchema = z.object({
  title: z.string(),
  date: z.string().nullable(),
  participants: z.array(z.string()),
  summary: z.string(),
  decisions: z.array(z.string()),
  actionItems: z.array(ActionItemSchema),
  keyPoints: z.array(z.string()),
  openIssues: z.array(z.string()),
  nextSteps: z.array(z.string()),
  project: z.string().nullable().optional(),
  sprint: z.string().nullable().optional(),
});

export const MeetingSchema = z.object({
  id: z.string().uuid(),
  transcript: z.string(),
  summary: MeetingSummarySchema,
  tags: z.array(z.string()),
  embedding: z.array(z.number()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateMeetingInputSchema = z.object({
  transcript: z.string().min(1),
  source: z.string().optional(),
});
