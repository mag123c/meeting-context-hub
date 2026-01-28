import type { AIProvider, ExtractOptions } from '../../adapters/ai/ai.interface.js';
import type { ExtractedContext } from '../../types/index.js';
import { InputError, ErrorCode } from '../../types/errors.js';

/** Minimum input length for meaningful extraction */
const MIN_INPUT_LENGTH = 10;

/**
 * Service for extracting structured context from raw input
 */
export class ExtractService {
  constructor(private readonly aiProvider: AIProvider) {}

  /**
   * Extract structured context from raw input text
   * @param input - Raw input text to extract from
   * @param options - Extraction options (language, domainContext)
   */
  async extract(input: string, options?: ExtractOptions): Promise<ExtractedContext> {
    // Validate input is not empty
    if (!input || input.trim().length === 0) {
      throw new InputError(
        'Input cannot be empty',
        ErrorCode.INVALID_INPUT,
        false
      );
    }

    const trimmedInput = input.trim();

    // Validate input is long enough for meaningful extraction
    if (trimmedInput.length < MIN_INPUT_LENGTH) {
      throw new InputError(
        `Input is too short (minimum ${MIN_INPUT_LENGTH} characters). Please provide more details.`,
        ErrorCode.INPUT_TOO_SHORT,
        false
      );
    }

    return this.aiProvider.extract(trimmedInput, options);
  }
}
