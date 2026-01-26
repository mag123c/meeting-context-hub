import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { Context, ListOptions } from '../../types/index.js';

export interface ListContextsResult {
  contexts: Context[];
  total: number;
}

/**
 * Use case for listing contexts
 */
export class ListContextsUseCase {
  constructor(private readonly storage: StorageProvider) {}

  async execute(options?: ListOptions): Promise<ListContextsResult> {
    const contexts = await this.storage.listContexts(options);
    const total = await this.storage.getContextCount(options?.projectId);

    return { contexts, total };
  }
}
