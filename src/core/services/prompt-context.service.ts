import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { PromptContext, PromptContextCategory } from '../../types/index.js';
import { createPromptContext, formatPromptContextsForPrompt } from '../domain/prompt-context.js';

/**
 * Service for managing prompt contexts (domain knowledge)
 */
export class PromptContextService {
  constructor(private readonly storage: StorageProvider) {}

  /**
   * Create a new prompt context
   * @param title Title of the context
   * @param content Content of the context
   * @param category Category of the context
   * @param projectId Optional project ID (null for global)
   */
  async create(
    title: string,
    content: string,
    category: PromptContextCategory = 'custom',
    projectId: string | null = null
  ): Promise<PromptContext> {
    const context = createPromptContext(title, content, category, projectId);
    await this.storage.savePromptContext(context);
    return context;
  }

  /**
   * Get prompt context by ID
   */
  async get(id: string): Promise<PromptContext | null> {
    return this.storage.getPromptContext(id);
  }

  /**
   * List prompt contexts
   * @param projectId undefined = all entries, null = global only, string = project-specific only
   */
  async list(projectId?: string | null): Promise<PromptContext[]> {
    return this.storage.listPromptContexts(projectId);
  }

  /**
   * List enabled prompt contexts
   * @param projectId If provided, returns global + project-specific enabled contexts
   */
  async listEnabled(projectId?: string): Promise<PromptContext[]> {
    return this.storage.listEnabledPromptContexts(projectId);
  }

  /**
   * Update a prompt context
   */
  async update(
    id: string,
    updates: Partial<Pick<PromptContext, 'title' | 'content' | 'category' | 'enabled'>>
  ): Promise<void> {
    await this.storage.updatePromptContext(id, updates);
  }

  /**
   * Toggle enabled status of a prompt context
   */
  async toggleEnabled(id: string): Promise<void> {
    const context = await this.storage.getPromptContext(id);
    if (context) {
      await this.storage.updatePromptContext(id, { enabled: !context.enabled });
    }
  }

  /**
   * Delete a prompt context
   */
  async delete(id: string): Promise<void> {
    await this.storage.deletePromptContext(id);
  }

  /**
   * Get formatted domain context string for AI prompt injection
   * @param projectId If provided, includes both global and project-specific contexts
   */
  async getDomainContextForPrompt(projectId?: string): Promise<string> {
    const enabledContexts = await this.listEnabled(projectId);
    return formatPromptContextsForPrompt(enabledContexts);
  }
}
