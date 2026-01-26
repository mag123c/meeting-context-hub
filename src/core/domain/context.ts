import { v4 as uuidv4 } from 'uuid';
import type { Context, ExtractedContext } from '../../types/index.js';

/**
 * Create a new Context entity from extracted data
 */
export function createContext(
  rawInput: string,
  extracted: ExtractedContext,
  projectId: string | null = null
): Context {
  const now = new Date();

  return {
    id: uuidv4(),
    projectId,
    rawInput,
    title: extracted.title,
    summary: extracted.summary,
    decisions: extracted.decisions,
    actionItems: extracted.actionItems,
    policies: extracted.policies,
    openQuestions: extracted.openQuestions,
    tags: extracted.tags,
    embedding: null, // Will be set later if embedding is enabled
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Format context for display
 */
export function formatContextPreview(context: Context): string {
  const lines: string[] = [];

  lines.push(`📋 ${context.title}`);
  lines.push(`   ${context.summary}`);

  if (context.decisions.length > 0) {
    lines.push(`   ✓ ${context.decisions.length} decision(s)`);
  }

  if (context.actionItems.length > 0) {
    lines.push(`   📌 ${context.actionItems.length} action item(s)`);
  }

  if (context.policies.length > 0) {
    lines.push(`   📜 ${context.policies.length} policy/policies`);
  }

  return lines.join('\n');
}
