import type { Tag, CreateTagInput, UpdateTagInput } from "./types";

export interface TagRepository {
  create(data: CreateTagInput): Promise<Tag>;
  getById(id: string): Promise<Tag | null>;
  getByName(name: string): Promise<Tag | null>;
  list(): Promise<Tag[]>;
  update(id: string, data: UpdateTagInput): Promise<Tag>;
  delete(id: string): Promise<void>;
  findOrCreateByNames(names: string[]): Promise<Tag[]>;
}
