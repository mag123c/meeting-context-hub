import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { EmbeddingService } from '../services/embedding.service.js';
import type { ActionItem } from '../../types/index.js';

/**
 * Input for updating a context
 */
export interface UpdateContextInput {
  title?: string;
  summary?: string;
  decisions?: string[];
  actionItems?: ActionItem[];
  policies?: string[];
  tags?: string[];
}

/**
 * Use case for managing individual contexts
 * Handles delete, update, and group change operations
 */
export class ManageContextUseCase {
  constructor(
    private readonly storage: StorageProvider,
    private readonly embeddingService?: EmbeddingService
  ) {}

  /**
   * Delete a context
   */
  async deleteContext(id: string): Promise<void> {
    const context = await this.storage.getContext(id);
    if (!context) {
      throw new Error('Context not found');
    }

    await this.storage.deleteContext(id);
  }

  /**
   * Change the group (project) of a context
   * @param contextId - Context ID to update
   * @param projectId - New project ID, or null to uncategorize
   */
  async changeGroup(contextId: string, projectId: string | null): Promise<void> {
    const context = await this.storage.getContext(contextId);
    if (!context) {
      throw new Error('Context not found');
    }

    // Validate project exists (if not setting to null)
    if (projectId !== null) {
      const project = await this.storage.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }
    }

    await this.storage.updateContext(contextId, { projectId });
  }

  /**
   * Update context content
   * Regenerates embedding if content that affects semantic meaning changes
   */
  async updateContext(id: string, updates: UpdateContextInput): Promise<void> {
    const context = await this.storage.getContext(id);
    if (!context) {
      throw new Error('Context not found');
    }

    // Build the update object
    const updateData: Record<string, unknown> = { ...updates };

    // Regenerate embedding if embedding service is available
    if (this.embeddingService) {
      // Merge updates with existing context to generate new embedding
      const updatedContext = {
        ...context,
        ...updates,
      };
      const newEmbedding = await this.embeddingService.generateForContext(updatedContext);
      if (newEmbedding) {
        updateData.embedding = newEmbedding;
      }
    }

    await this.storage.updateContext(id, updateData);
  }
}
