import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { ExtractOptions } from '../../adapters/ai/ai.interface.js';
import type { Context, SearchResult } from '../../types/index.js';
import { ExtractService } from '../services/extract.service.js';
import { EmbeddingService } from '../services/embedding.service.js';
import { ChainService } from '../services/chain.service.js';
import { DictionaryService } from '../services/dictionary.service.js';
import { PromptContextService } from '../services/prompt-context.service.js';
import { createContext } from '../domain/context.js';

export interface AddContextInput {
  rawInput: string;
  projectId: string | null;
  /** Options for AI extraction (language, domainContext) */
  extractOptions?: ExtractOptions;
}

export interface AddContextResult {
  context: Context;
  relatedContexts: SearchResult[];
}

/**
 * Use case for adding a new context
 */
export class AddContextUseCase {
  private dictionaryService: DictionaryService | null = null;
  private promptContextService: PromptContextService | null = null;

  constructor(
    private readonly extractService: ExtractService,
    private readonly embeddingService: EmbeddingService,
    private readonly chainService: ChainService,
    private readonly storage: StorageProvider
  ) {
    // Initialize dictionary service for text correction
    this.dictionaryService = new DictionaryService(storage);
    // Initialize prompt context service for domain knowledge
    this.promptContextService = new PromptContextService(storage);
  }

  async execute(input: AddContextInput): Promise<AddContextResult> {
    // 0. Apply dictionary corrections if available
    let processedInput = input.rawInput;
    if (this.dictionaryService) {
      processedInput = await this.dictionaryService.correctText(processedInput);
    }

    // 0.5. Get domain context for prompt injection
    let domainContext: string | undefined;
    if (this.promptContextService) {
      const domainContextStr = await this.promptContextService.getDomainContextForPrompt();
      if (domainContextStr) {
        domainContext = domainContextStr;
      }
    }

    // Merge extract options with domain context
    const extractOptions: ExtractOptions = {
      ...input.extractOptions,
      domainContext: domainContext || input.extractOptions?.domainContext,
    };

    // 1. Extract structured data from processed input
    const extracted = await this.extractService.extract(processedInput, extractOptions);

    // 2. Create context entity (use corrected input as rawInput)
    const context = createContext(processedInput, extracted, input.projectId);

    // 3. Generate embedding if available
    if (this.embeddingService.isAvailable()) {
      try {
        const embedding = await this.embeddingService.generateForContext({
          ...extracted,
          rawInput: processedInput,
        });
        if (embedding) {
          context.embedding = embedding;
        }
      } catch {
        // Continue without embedding if it fails
      }
    }

    // 4. Find related contexts before saving (if embedding available)
    let relatedContexts: SearchResult[] = [];
    if (context.embedding) {
      const contextsWithEmbeddings = await this.storage.listContextsWithEmbeddings(
        input.projectId ?? undefined
      );
      relatedContexts = this.chainService.findRelated(
        context.embedding,
        contextsWithEmbeddings,
        { limit: 5, threshold: 0.5 }
      );
    }

    // 5. Save to storage
    await this.storage.saveContext(context);

    return { context, relatedContexts };
  }
}
