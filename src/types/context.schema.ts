import { z } from "zod";

export const ContextTypeSchema = z.enum(["text", "image", "audio", "file"]);

export const ContextSchema = z.object({
  id: z.string().uuid(),
  type: ContextTypeSchema,
  content: z.string().min(1),
  summary: z.string(),
  tags: z.array(z.string()),
  embedding: z.array(z.number()).optional(),
  source: z.string().optional(),
  project: z.string().optional(),
  category: z.string().optional(),
  sprint: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateContextInputSchema = z.object({
  type: ContextTypeSchema,
  content: z.string().min(1),
  source: z.string().optional(),
  project: z.string().optional(),
  category: z.string().optional(),
  sprint: z.string().optional(),
});

export const ListOptionsSchema = z.object({
  tags: z.array(z.string()).optional(),
  type: ContextTypeSchema.optional(),
  project: z.string().optional(),
  category: z.string().optional(),
  sprint: z.string().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

// Types are inferred from schemas but exported from context.types.ts
// to maintain separation between runtime schemas and type definitions
