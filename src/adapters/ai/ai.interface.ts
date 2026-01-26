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

// Re-export AIError as AIExtractionError for backward compatibility
export { AIError as AIExtractionError } from '../../types/errors.js';
