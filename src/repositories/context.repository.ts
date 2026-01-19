import type {
  Context,
  ContextWithTags,
  CreateContextInput,
  UpdateContextInput,
  ContextSource,
} from "./types";
import type { Pagination, PaginatedResult } from "./types";

export interface ContextRepository {
  create(userId: string, data: CreateContextInput): Promise<Context>;
  getById(id: string): Promise<ContextWithTags | null>;
  listByUser(
    userId: string,
    pagination?: Pagination
  ): Promise<PaginatedResult<ContextWithTags>>;
  listBySource(
    userId: string,
    source: ContextSource,
    pagination?: Pagination
  ): Promise<PaginatedResult<ContextWithTags>>;
  listByTag(
    userId: string,
    tagId: string,
    pagination?: Pagination
  ): Promise<PaginatedResult<ContextWithTags>>;
  update(id: string, data: UpdateContextInput): Promise<Context>;
  delete(id: string): Promise<void>;
  addTags(contextId: string, tagIds: string[]): Promise<void>;
  removeTags(contextId: string, tagIds: string[]): Promise<void>;
  setTags(contextId: string, tagIds: string[]): Promise<void>;
  search(
    userId: string,
    query: string,
    pagination?: Pagination
  ): Promise<PaginatedResult<ContextWithTags>>;
}
