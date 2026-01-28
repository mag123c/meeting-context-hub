import { randomUUID } from 'crypto';

/**
 * Category types for prompt context
 */
export type PromptContextCategory = 'domain' | 'policy' | 'terminology' | 'custom';

/**
 * PromptContext entity - Domain knowledge to be provided to AI during extraction
 */
export interface PromptContext {
  id: string;
  projectId: string | null; // null = global, string = group-specific
  category: PromptContextCategory;
  title: string;
  content: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new PromptContext entity
 */
export function createPromptContext(
  title: string,
  content: string,
  category: PromptContextCategory = 'custom',
  projectId: string | null = null
): PromptContext {
  const now = new Date();
  return {
    id: randomUUID(),
    projectId,
    category,
    title,
    content,
    enabled: true,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Format prompt contexts into a single string for AI prompt injection
 */
export function formatPromptContextsForPrompt(contexts: PromptContext[]): string {
  const enabledContexts = contexts.filter(c => c.enabled);
  if (enabledContexts.length === 0) return '';

  return enabledContexts
    .map(c => `[${c.category.toUpperCase()}] ${c.title}:\n${c.content}`)
    .join('\n\n');
}
