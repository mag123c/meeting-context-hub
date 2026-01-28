import type { StorageProvider } from '../../adapters/storage/storage.interface.js';
import type { DictionaryEntry } from '../../types/index.js';
import { randomUUID } from 'crypto';

/**
 * Service for managing dictionary entries and correcting text
 */
export class DictionaryService {
  private mappingsCache: Map<string, Map<string, string>> = new Map(); // projectId -> mappings

  constructor(private readonly storage: StorageProvider) {}

  /**
   * Add a new dictionary entry
   * @param source The source text to be replaced
   * @param target The target text to replace with
   * @param projectId Optional project ID (null for global)
   */
  async addEntry(source: string, target: string, projectId: string | null = null): Promise<DictionaryEntry> {
    const now = new Date();
    const entry: DictionaryEntry = {
      id: randomUUID(),
      projectId,
      source,
      target,
      createdAt: now,
      updatedAt: now,
    };

    await this.storage.saveDictionaryEntry(entry);
    this.invalidateCache();

    return entry;
  }

  /**
   * Get entry by ID
   */
  async getEntry(id: string): Promise<DictionaryEntry | null> {
    return this.storage.getDictionaryEntry(id);
  }

  /**
   * Get entry by source text
   */
  async getEntryBySource(source: string): Promise<DictionaryEntry | null> {
    return this.storage.getDictionaryEntryBySource(source);
  }

  /**
   * List dictionary entries
   * @param projectId undefined = all entries, null = global only, string = project-specific only
   */
  async listEntries(projectId?: string | null): Promise<DictionaryEntry[]> {
    return this.storage.listDictionaryEntries(projectId);
  }

  /**
   * Update an existing entry
   */
  async updateEntry(id: string, updates: Partial<Pick<DictionaryEntry, 'source' | 'target'>>): Promise<void> {
    await this.storage.updateDictionaryEntry(id, updates);
    this.invalidateCache();
  }

  /**
   * Delete an entry
   */
  async deleteEntry(id: string): Promise<void> {
    await this.storage.deleteDictionaryEntry(id);
    this.invalidateCache();
  }

  /**
   * Correct text using dictionary mappings
   *
   * Algorithm:
   * 1. Load mappings cache (lazy) - global + project-specific with override
   * 2. Sort sources by length (longest first) to avoid partial matches
   * 3. Replace each source with target (case-insensitive, preserve original case when possible)
   *
   * @param text The text to correct
   * @param projectId Optional project ID for group-specific mappings
   */
  async correctText(text: string, projectId?: string): Promise<string> {
    if (!text) return text;

    const cacheKey = projectId ?? '__global__';

    // Load mappings if not cached
    if (!this.mappingsCache.has(cacheKey)) {
      const mappings = await this.storage.getAllDictionaryMappings(projectId);
      this.mappingsCache.set(cacheKey, mappings);
    }

    const mappings = this.mappingsCache.get(cacheKey)!;

    if (mappings.size === 0) {
      return text;
    }

    // Sort sources by length (longest first)
    const sortedSources = Array.from(mappings.keys()).sort(
      (a, b) => b.length - a.length
    );

    let result = text;

    for (const source of sortedSources) {
      const target = mappings.get(source)!;
      // Case-insensitive replacement
      const regex = new RegExp(this.escapeRegExp(source), 'gi');
      result = result.replace(regex, target);
    }

    return result;
  }

  /**
   * Invalidate the mappings cache
   * Call this after any modification to dictionary entries
   */
  invalidateCache(): void {
    this.mappingsCache.clear();
  }

  /**
   * Escape special regex characters in a string
   */
  private escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
