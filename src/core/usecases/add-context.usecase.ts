import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { Context, SearchResult } from '../../types/index.js';
import { ExtractService } from '../services/extract.service.js';
import { EmbeddingService } from '../services/embedding.service.js';
import { ChainService } from '../services/chain.service.js';
import { createContext } from '../domain/context.js';

export interface AddContextInput {
  rawInput: string;
  projectId: string | null;
}

export interface AddContextResult {
  context: Context;
  relatedContexts: SearchResult[];
}

/**
 * Use case for adding a new context
 */
export class AddContextUseCase {
  constructor(
    private readonly extractService: ExtractService,
    private readonly embeddingService: EmbeddingService,
    private readonly chainService: ChainService,
    private readonly storage: StorageProvider
  ) {}

  async execute(input: AddContextInput): Promise<AddContextResult> {
    // 1. Extract structured data from raw input
    const extracted = await this.extractService.extract(input.rawInput);

    // 2. Create context entity
    const context = createContext(input.rawInput, extracted, input.projectId);

    // 3. Generate embedding if available
    if (this.embeddingService.isAvailable()) {
      try {
        const embedding = await this.embeddingService.generateForContext({
          ...extracted,
          rawInput: input.rawInput,
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
