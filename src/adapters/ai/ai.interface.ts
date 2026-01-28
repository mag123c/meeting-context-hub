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
 * Options for context translation
 */
export interface TranslateOptions {
  /** Target language for translation */
  targetLanguage: 'ko' | 'en';
}

/**
 * AI provider interface (Port)
 */
export interface AIProvider {
  /**
   * Extract structured context from raw input text
   */
  extract(input: string, options?: ExtractOptions): Promise<ExtractedContext>;

  /**
   * Translate extracted context to target language (optional)
   */
  translate?(context: ExtractedContext, options: TranslateOptions): Promise<ExtractedContext>;
}

// Re-export AIError as AIExtractionError for backward compatibility
export { AIError as AIExtractionError } from '../../types/errors.js';
