import type { AIProvider } from '../../adapters/ai/ai.interface.js';
import type { ExtractedContext } from '../../types/index.js';

/**
 * Service for extracting structured context from raw input
 */
export class ExtractService {
  constructor(private readonly aiProvider: AIProvider) {}

  /**
   * Extract structured context from raw input text
   */
  async extract(input: string): Promise<ExtractedContext> {
    if (!input || input.trim().length === 0) {
      throw new Error('Input cannot be empty');
    }

    return this.aiProvider.extract(input.trim());
  }
}
