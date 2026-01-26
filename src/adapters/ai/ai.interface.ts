import type { ExtractedContext } from '../../types/index.js';

/**
 * AI provider interface (Port)
 */
export interface AIProvider {
  /**
   * Extract structured context from raw input text
   */
  extract(input: string): Promise<ExtractedContext>;
}

/**
 * AI extraction error
 */
export class AIExtractionError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'AIExtractionError';
  }
}
