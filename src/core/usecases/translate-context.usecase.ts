import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { AIProvider } from '../../adapters/ai/ai.interface.js';
import type { EmbeddingService } from '../services/embedding.service.js';
import type { Context, ExtractedContext, ListOptions } from '../../types/index.js';

/**
 * Preview of translated context
 */
export interface TranslatePreview {
  original: Context;
  translated: ExtractedContext;
}

/**
 * Use case for translating context content to a different language
 * Uses AI to translate and regenerates embeddings
 */
export class TranslateContextUseCase {
  constructor(
    private readonly storage: StorageProvider,
    private readonly ai: AIProvider,
    private readonly embeddingService?: EmbeddingService
  ) {}

  /**
   * Generate a translation preview without applying changes
   */
  async preview(contextId: string, targetLanguage: 'ko' | 'en'): Promise<TranslatePreview> {
    // Get the context
    const context = await this.storage.getContext(contextId);
    if (!context) {
      throw new Error('Context not found');
    }

    // Check if AI provider supports translation
    if (!this.ai.translate) {
      throw new Error('AI provider does not support translation');
    }

    // Extract content for translation (excluding rawInput, embedding, timestamps)
    const contentToTranslate: ExtractedContext = {
      title: context.title,
      summary: context.summary,
      decisions: context.decisions,
      actionItems: context.actionItems,
      policies: context.policies,
      openQuestions: context.openQuestions,
      tags: context.tags,
    };

    // Translate using AI
    const translated = await this.ai.translate(contentToTranslate, { targetLanguage });

    return {
      original: context,
      translated,
    };
  }

  /**
   * Apply a translation preview to update the context
   */
  async apply(preview: TranslatePreview): Promise<void> {
    const { original, translated } = preview;

    // Verify context still exists
    const context = await this.storage.getContext(original.id);
    if (!context) {
      throw new Error('Context not found');
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      title: translated.title,
      summary: translated.summary,
      decisions: translated.decisions,
      actionItems: translated.actionItems,
      policies: translated.policies,
      openQuestions: translated.openQuestions,
      tags: translated.tags,
    };

    // Regenerate embedding if service is available
    if (this.embeddingService) {
      const updatedContext = {
        ...context,
        ...translated,
      };
      const newEmbedding = await this.embeddingService.generateForContext(updatedContext);
      if (newEmbedding) {
        updateData.embedding = newEmbedding;
      }
    }

    // Update the context
    await this.storage.updateContext(original.id, updateData);
  }

  /**
   * List contexts available for translation
   */
  async listContextsForTranslation(options?: ListOptions): Promise<Context[]> {
    return this.storage.listContexts(options);
  }
}
