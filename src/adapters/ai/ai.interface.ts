import type { ExtractedContext } from '../../types/index.js';

/**
 * Options for context extraction
 */
export interface ExtractOptions {
  /** Output language for extracted content */
  language?: 'ko' | 'en';
  /** Domain knowledge to provide context for extraction */
  domainContext?: string;
}

/**
 * AI provider interface (Port)
 */
export interface AIProvider {
  /**
   * Extract structured context from raw input text
   */
  extract(input: string, options?: ExtractOptions): Promise<ExtractedContext>;
}

// Re-export AIError as AIExtractionError for backward compatibility
export { AIError as AIExtractionError } from '../../types/errors.js';
