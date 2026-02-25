import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { Decision, DecisionStatus } from '../../types/index.js';
import { createDecision } from '../domain/decision.js';

/**
 * Use case for managing decisions
 */
export class ManageDecisionUseCase {
  constructor(private readonly storage: StorageProvider) {}

  async create(params: {
    contextId: string;
    projectId?: string | null;
    content: string;
    status?: DecisionStatus;
  }): Promise<Decision> {
    const decision = createDecision(
      params.contextId,
      params.content,
      params.projectId ?? null,
      params.status
    );
    await this.storage.saveDecision(decision);
    return decision;
  }

  async listByProject(projectId: string, options?: {
    status?: DecisionStatus;
  }): Promise<Decision[]> {
    return this.storage.listDecisionsByProject(projectId, options);
  }

  async listByContext(contextId: string): Promise<Decision[]> {
    return this.storage.listDecisionsByContext(contextId);
  }

  async updateStatus(decisionId: string, params: {
    status: DecisionStatus;
    supersededBy?: string;
  }): Promise<void> {
    const existing = await this.storage.getDecision(decisionId);
    if (!existing) {
      throw new Error('Decision not found');
    }
    await this.storage.updateDecision(decisionId, {
      status: params.status,
      supersededBy: params.supersededBy ?? null,
    });
  }

  async delete(decisionId: string): Promise<void> {
    const existing = await this.storage.getDecision(decisionId);
    if (!existing) {
      throw new Error('Decision not found');
    }
    await this.storage.deleteDecision(decisionId);
  }
}
