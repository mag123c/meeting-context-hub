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
   */
  async create(
    title: string,
    content: string,
    category: PromptContextCategory = 'custom'
  ): Promise<PromptContext> {
    const context = createPromptContext(title, content, category);
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
   * List all prompt contexts
   */
  async list(): Promise<PromptContext[]> {
    return this.storage.listPromptContexts();
  }

  /**
   * List only enabled prompt contexts
   */
  async listEnabled(): Promise<PromptContext[]> {
    return this.storage.listEnabledPromptContexts();
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
   */
  async getDomainContextForPrompt(): Promise<string> {
    const enabledContexts = await this.listEnabled();
    return formatPromptContextsForPrompt(enabledContexts);
  }
}
