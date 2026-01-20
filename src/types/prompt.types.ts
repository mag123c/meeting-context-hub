import { z } from "zod";

export const PromptSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  name: z.string(),
  description: z.string().optional(),
  system: z.string(),
  template: z.function().args(z.any()).returns(z.string()),
});

export type Prompt = z.infer<typeof PromptSchema>;
