import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { Context } from '../../types/index.js';

/**
 * Use case for getting a single context by ID
 */
export class GetContextUseCase {
  constructor(private readonly storage: StorageProvider) {}

  async execute(id: string): Promise<Context | null> {
    return this.storage.getContext(id);
  }
}
