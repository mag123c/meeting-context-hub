import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface PromptConfig<T extends z.ZodType> {
  version: string;
  model: string;
  maxTokens: number;
  systemPrompt: string;
  outputSchema: T;
}

export async function callClaude<T extends z.ZodType>(
  config: PromptConfig<T>,
  userMessage: string
): Promise<z.infer<T>> {
  const response = await anthropic.messages.create({
    model: config.model,
    max_tokens: config.maxTokens,
    system: config.systemPrompt,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // JSON 추출 (```json ... ``` 블록 처리)
  let jsonText = textContent.text;
  const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1];
  }

  const parsed = JSON.parse(jsonText);
  return config.outputSchema.parse(parsed);
}

export async function callClaudeWithTools<T extends z.ZodType>(
  config: PromptConfig<T>,
  userMessage: string,
  tools: Anthropic.Tool[]
): Promise<{
  result: z.infer<T> | null;
  toolCalls: Anthropic.ToolUseBlock[];
}> {
  const response = await anthropic.messages.create({
    model: config.model,
    max_tokens: config.maxTokens,
    system: config.systemPrompt,
    tools,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const toolCalls = response.content.filter(
    (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
  );

  const textContent = response.content.find((c) => c.type === "text");
  let result = null;

  if (textContent && textContent.type === "text") {
    try {
      let jsonText = textContent.text;
      const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
      const parsed = JSON.parse(jsonText);
      result = config.outputSchema.parse(parsed);
    } catch {
      // 텍스트가 JSON이 아닐 수 있음
    }
  }

  return { result, toolCalls };
}

export { anthropic };
