import { createDecision } from '../domain/decision.js';
import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { Decision } from '../../types/index.js';

/**
 * Create Decision entities from context decisions array and save them
 */
export async function createDecisionsFromContext(
  storage: StorageProvider,
  contextId: string,
  projectId: string | null,
  decisions: string[],
  createdAt: Date
): Promise<Decision[]> {
  const created: Decision[] = [];
  for (const content of decisions) {
    if (!content.trim()) continue;
    const decision = createDecision(contextId, content.trim(), projectId, 'active', createdAt);
    await storage.saveDecision(decision);
    created.push(decision);
  }
  return created;
}
