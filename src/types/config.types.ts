import { z } from "zod";

export const ConfigSchema = z.object({
  anthropicApiKey: z.string().min(1),
  openaiApiKey: z.string().min(1),
  obsidianVaultPath: z.string().min(1),
  mchFolder: z.string().min(1),
});

export type Config = z.infer<typeof ConfigSchema>;
