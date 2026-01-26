import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { AIProvider } from './ai.interface.js';
import type { ExtractedContext, ActionItem } from '../../types/index.js';
import { AIError, ErrorCode, detectErrorCode } from '../../types/errors.js';
import { withRetry } from '../../core/services/retry.service.js';

// Zod schema for validation
const ActionItemSchema = z.object({
  task: z.string(),
  assignee: z.string().optional(),
  dueDate: z.string().optional(),
});

const ExtractedContextSchema = z.object({
  title: z.string(),
  summary: z.string(),
  decisions: z.array(z.string()),
  actionItems: z.array(ActionItemSchema),
  policies: z.array(z.string()),
  openQuestions: z.array(z.string()),
  tags: z.array(z.string()),
});

/**
 * Claude AI adapter for context extraction
 */
export class ClaudeAdapter implements AIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async extract(input: string): Promise<ExtractedContext> {
    const prompt = this.buildExtractionPrompt(input);

    try {
      const response = await withRetry(
        () =>
          this.client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          }),
        {
          maxAttempts: 3,
          baseDelayMs: 1000,
          onRetry: (error, attempt) => {
            console.error(`[AI Extraction] Retry ${attempt}: ${error.message}`);
          },
        }
      );

      // Extract text from response
      const textBlock = response.content.find((block) => block.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new AIError(
          'No text response from Claude',
          ErrorCode.AI_EXTRACTION_FAILED,
          true
        );
      }

      // Parse JSON from response
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new AIError(
          'No JSON found in Claude response',
          ErrorCode.AI_EXTRACTION_FAILED,
          true
        );
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const validated = ExtractedContextSchema.parse(parsed);

      return {
        title: validated.title,
        summary: validated.summary,
        decisions: validated.decisions,
        actionItems: validated.actionItems as ActionItem[],
        policies: validated.policies,
        openQuestions: validated.openQuestions,
        tags: validated.tags,
      };
    } catch (error) {
      // Don't wrap AIError
      if (error instanceof AIError) {
        throw error;
      }

      if (error instanceof z.ZodError) {
        throw new AIError(
          `Invalid extraction result: ${error.message}`,
          ErrorCode.AI_EXTRACTION_FAILED,
          true,
          error
        );
      }

      const originalError = error instanceof Error ? error : undefined;
      const errorCode = detectErrorCode(error);

      throw new AIError(
        `Failed to extract context: ${originalError?.message ?? 'Unknown error'}`,
        errorCode,
        true,
        originalError
      );
    }
  }

  private buildExtractionPrompt(input: string): string {
    return `You are a meeting context extractor. Analyze the following discussion/meeting notes and extract structured information for developers.

<input>
${input}
</input>

Extract the following information and respond with ONLY a JSON object (no markdown, no explanation):

{
  "title": "A concise title summarizing the main topic (5-10 words)",
  "summary": "A 1-2 sentence summary of the key points",
  "decisions": ["List of decisions that were made (explicit agreements or choices)"],
  "actionItems": [
    {
      "task": "Description of the task",
      "assignee": "Person responsible (if mentioned)",
      "dueDate": "Due date (if mentioned)"
    }
  ],
  "policies": ["List of conventions, rules, standards, or policies defined"],
  "openQuestions": ["List of unresolved questions or items needing follow-up"],
  "tags": ["relevant", "tags", "for", "categorization"]
}

Rules:
- title: Should be descriptive but concise
- summary: Focus on the most important outcome
- decisions: Only include explicit decisions, not discussions
- actionItems: Include task, assignee (if known), dueDate (if mentioned)
- policies: Include any conventions, rules, or standards mentioned
- openQuestions: Include anything that needs follow-up or clarification
- tags: Generate 3-7 relevant tags for categorization

If a field has no content, use an empty array [].
Respond with ONLY the JSON object, no additional text.`;
  }
}
