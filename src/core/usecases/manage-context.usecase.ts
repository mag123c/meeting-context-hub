import type { StorageProvider } from '../../adapters/storage/storage.interface.js';

/**
 * Use case for managing individual contexts
 * Handles delete and group change operations
 */
export class ManageContextUseCase {
  constructor(private readonly storage: StorageProvider) {}

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
}
