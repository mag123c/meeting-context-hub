import { randomUUID } from 'crypto';
import type { Decision, DecisionStatus } from '../../types/index.js';

/**
 * Create a new Decision entity
 */
export function createDecision(
  contextId: string,
  content: string,
  projectId: string | null = null,
  status: DecisionStatus = 'active',
  createdAt?: Date
): Decision {
  const now = createdAt ?? new Date();
  return {
    id: randomUUID(),
    contextId,
    projectId,
    content,
    status,
    supersededBy: null,
    createdAt: now,
    updatedAt: now,
  };
}
